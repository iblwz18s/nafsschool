import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentPublic {
  id: string;
  student_name: string;
}

interface GetStudentsResponse {
  success: boolean;
  students?: StudentPublic[];
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

    // Get grade from query parameter
    const url = new URL(req.url);
    const grade = url.searchParams.get('grade');

    if (!grade || typeof grade !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'الصف مطلوب' } as GetStudentsResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate grade format (prevent SQL injection via parameter validation)
    const validGrades = ['grade-3', 'grade-6', '3', '6'];
    if (!validGrades.includes(grade)) {
      return new Response(
        JSON.stringify({ success: false, error: 'الصف غير صالح' } as GetStudentsResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch students - only return public info (id and name), NOT pin_code
    const { data: students, error: fetchError } = await supabase
      .from('students')
      .select('id, student_name')
      .eq('grade', grade)
      .order('student_name');

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في تحميل قائمة الطلاب' } as GetStudentsResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        students: students || []
      } as GetStudentsResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get students error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'حدث خطأ غير متوقع' } as GetStudentsResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
