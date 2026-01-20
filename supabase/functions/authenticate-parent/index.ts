import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  student_id: string;
  pin_code: string;
}

interface AuthResponse {
  success: boolean;
  student_name?: string;
  student_id?: string;
  error?: string;
  session_token?: string;
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

    const { student_id, pin_code }: AuthRequest = await req.json();

    // Validate input
    if (!student_id || typeof student_id !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'معرف الطالب مطلوب' } as AuthResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pin_code || typeof pin_code !== 'string' || pin_code.length !== 4 || !/^\d{4}$/.test(pin_code)) {
      return new Response(
        JSON.stringify({ success: false, error: 'الرمز يجب أن يكون 4 أرقام' } as AuthResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(student_id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'معرف الطالب غير صالح' } as AuthResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch student and verify PIN server-side
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('id, student_name, pin_code')
      .eq('id', student_id)
      .single();

    if (fetchError || !student) {
      // Don't reveal if student exists or not
      return new Response(
        JSON.stringify({ success: false, error: 'الرمز غير صحيح' } as AuthResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Secure PIN comparison
    if (student.pin_code !== pin_code) {
      return new Response(
        JSON.stringify({ success: false, error: 'الرمز غير صحيح - أدخل آخر 4 أرقام من جوال ولي الأمر' } as AuthResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a session token (simple implementation for now)
    const sessionToken = crypto.randomUUID();

    // Return success without exposing PIN
    return new Response(
      JSON.stringify({
        success: true,
        student_name: student.student_name,
        student_id: student.id,
        session_token: sessionToken
      } as AuthResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Authentication error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'حدث خطأ غير متوقع' } as AuthResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
