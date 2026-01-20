import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProgressRequest {
  student_id: string;
  standard_id: string;
  sub_indicator_id: string;
  score: number;
  total_questions: number;
}

interface ProgressResponse {
  success: boolean;
  progress_id?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { student_id, standard_id, sub_indicator_id, score, total_questions }: ProgressRequest = await req.json();

    // Validate student_id (UUID format)
    if (!student_id || typeof student_id !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'معرف الطالب مطلوب' } as ProgressResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(student_id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'معرف الطالب غير صالح' } as ProgressResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate standard_id format
    if (!standard_id || typeof standard_id !== 'string' || standard_id.length > 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'معرف المعيار غير صالح' } as ProgressResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate sub_indicator_id format
    if (!sub_indicator_id || typeof sub_indicator_id !== 'string' || sub_indicator_id.length > 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'معرف المؤشر الفرعي غير صالح' } as ProgressResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate score
    if (typeof score !== 'number' || !Number.isInteger(score)) {
      return new Response(
        JSON.stringify({ success: false, error: 'الدرجة يجب أن تكون رقماً صحيحاً' } as ProgressResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (score < 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'الدرجة لا يمكن أن تكون سالبة' } as ProgressResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate total_questions
    if (typeof total_questions !== 'number' || !Number.isInteger(total_questions)) {
      return new Response(
        JSON.stringify({ success: false, error: 'عدد الأسئلة يجب أن يكون رقماً صحيحاً' } as ProgressResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (total_questions <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'عدد الأسئلة يجب أن يكون أكبر من صفر' } as ProgressResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate score doesn't exceed total_questions
    if (score > total_questions) {
      return new Response(
        JSON.stringify({ success: false, error: 'الدرجة لا يمكن أن تتجاوز عدد الأسئلة' } as ProgressResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ success: false, error: 'الطالب غير موجود' } as ProgressResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert progress record
    const { data: progress, error: insertError } = await supabase
      .from('student_progress')
      .insert({
        student_id,
        standard_id,
        sub_indicator_id,
        score,
        total_questions
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في حفظ النتيجة' } as ProgressResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        progress_id: progress.id
      } as ProgressResponse),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Progress submission error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'حدث خطأ غير متوقع' } as ProgressResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
