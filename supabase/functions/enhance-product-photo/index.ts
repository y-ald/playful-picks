import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const DEFAULT_PROMPT = `Transform this into a professional e-commerce product photo for a high-end children's boutique catalog (Bonpoint / Jacadi / Bonton aesthetic).
- Pure clean cream studio background, soft uniform color around #F5F1EA, very subtle vignette
- Soft diffused studio lighting from top-left, gentle realistic contact shadow beneath the item for depth
- Item perfectly centered, flat-lay style, full item visible with comfortable margin
- PRESERVE EXACTLY the original garment: fabric, texture, color, pattern, stitching, buttons, proportions, label — do NOT alter the product itself
- Ultra sharp focus, true-to-life colors, high resolution
- No props, no text, no watermark, no people, no mannequin, no hangers`;

// Google AI Studio (Gemini API) — Nano Banana image model
const MODEL = 'gemini-2.5-flash-image-preview';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_AI_STUDIO_API_KEY missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth + admin check
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { imageBase64, mimeType, prompt } = body as {
      imageBase64?: string; mimeType?: string; prompt?: string;
    };
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const finalPrompt = (prompt && prompt.trim()) || DEFAULT_PROMPT;

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: finalPrompt },
              { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
            ],
          }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      },
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('Google AI Studio error', upstream.status, errText);
      return new Response(JSON.stringify({ error: 'Image enhancement failed', detail: errText }), {
        status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await upstream.json();
    const parts = result?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: any) => p?.inlineData?.data || p?.inline_data?.data);
    const b64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
    const outMime = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || 'image/png';

    if (!b64) {
      console.error('No image in response', JSON.stringify(result).slice(0, 800));
      return new Response(JSON.stringify({ error: 'No image returned', raw: result }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ imageBase64: b64, mimeType: outMime }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
