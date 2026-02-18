/**
 * Generate creator option images via Venice AI and upload to Supabase Storage.
 * Run: node scripts/generate-creator-images.mjs
 */

const VENICE_API_KEY = process.env.VENICE_API_KEY || 'VENICE-ADMIN-KEY-vc7X5wZPkaS8rceX131h8k4qNp0byLseoxWz-MPNjM';
const SUPABASE_URL = 'https://akpwujpdbppmummswoey.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcHd1anBkYnBwbXVtbXN3b2V5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4NTcyMiwiZXhwIjoyMDg2NjYxNzIyfQ.VEFVeXFUuCpuxmFTNz-nIGA2kr4oam290X0_y6UkMPo';
const BUCKET = 'creator-images';

const IMAGE_SPECS = [
  // Ethnicities - face portrait
  { category: 'ethnicity', id: 'caucasian', prompt: 'beautiful caucasian european woman, close-up face portrait, soft warm lighting, looking at camera, seductive smile, dark background, photorealistic' },
  { category: 'ethnicity', id: 'asian', prompt: 'beautiful asian woman, close-up face portrait, soft warm lighting, looking at camera, seductive smile, dark background, photorealistic' },
  { category: 'ethnicity', id: 'black', prompt: 'beautiful black african woman, close-up face portrait, soft warm lighting, looking at camera, seductive smile, dark background, photorealistic' },
  { category: 'ethnicity', id: 'latina', prompt: 'beautiful latina hispanic woman, close-up face portrait, soft warm lighting, looking at camera, seductive smile, dark background, photorealistic' },
  { category: 'ethnicity', id: 'arab', prompt: 'beautiful arab middle-eastern woman, close-up face portrait, soft warm lighting, looking at camera, seductive smile, dark background, photorealistic' },
  { category: 'ethnicity', id: 'indian', prompt: 'beautiful indian south-asian woman, close-up face portrait, soft warm lighting, looking at camera, seductive smile, dark background, photorealistic' },

  // Hair styles
  { category: 'hairstyle', id: 'straight', prompt: 'beautiful woman with long straight hair, portrait showing hair, soft warm lighting, dark background, photorealistic' },
  { category: 'hairstyle', id: 'bangs', prompt: 'beautiful woman with bangs fringe hairstyle, portrait showing hair, soft warm lighting, dark background, photorealistic' },
  { category: 'hairstyle', id: 'curly', prompt: 'beautiful woman with curly voluminous hair, portrait showing hair, soft warm lighting, dark background, photorealistic' },
  { category: 'hairstyle', id: 'bun', prompt: 'beautiful woman with elegant hair bun updo, portrait showing hair, soft warm lighting, dark background, photorealistic' },
  { category: 'hairstyle', id: 'short', prompt: 'beautiful woman with short pixie haircut, portrait showing hair, soft warm lighting, dark background, photorealistic' },
  { category: 'hairstyle', id: 'ponytail', prompt: 'beautiful woman with high ponytail hairstyle, portrait showing hair, soft warm lighting, dark background, photorealistic' },

  // Hair colors
  { category: 'haircolor', id: 'brunette', prompt: 'beautiful woman with dark brown brunette hair, close-up portrait, soft warm lighting, dark background, photorealistic' },
  { category: 'haircolor', id: 'blonde', prompt: 'beautiful woman with golden blonde hair, close-up portrait, soft warm lighting, dark background, photorealistic' },
  { category: 'haircolor', id: 'black', prompt: 'beautiful woman with jet black hair, close-up portrait, soft warm lighting, dark background, photorealistic' },
  { category: 'haircolor', id: 'redhead', prompt: 'beautiful woman with red ginger hair, close-up portrait, soft warm lighting, dark background, photorealistic' },
  { category: 'haircolor', id: 'pink', prompt: 'beautiful woman with vibrant pink dyed hair, close-up portrait, soft warm lighting, dark background, photorealistic' },

  // Eye colors - close-up
  { category: 'eyecolor', id: 'brown', prompt: 'beautiful woman with warm brown eyes, close-up face portrait focusing on eyes, soft warm lighting, dark background, photorealistic' },
  { category: 'eyecolor', id: 'blue', prompt: 'beautiful woman with striking blue eyes, close-up face portrait focusing on eyes, soft warm lighting, dark background, photorealistic' },
  { category: 'eyecolor', id: 'green', prompt: 'beautiful woman with vivid green eyes, close-up face portrait focusing on eyes, soft warm lighting, dark background, photorealistic' },

  // Body types - upper body / portrait
  { category: 'bodytype', id: 'skinny', prompt: 'beautiful slim skinny petite woman, upper body portrait, elegant pose, soft warm lighting, dark background, photorealistic' },
  { category: 'bodytype', id: 'athletic', prompt: 'beautiful athletic fit toned woman, upper body portrait, confident pose, soft warm lighting, dark background, photorealistic' },
  { category: 'bodytype', id: 'average', prompt: 'beautiful woman with average natural body, upper body portrait, relaxed pose, soft warm lighting, dark background, photorealistic' },
  { category: 'bodytype', id: 'curvy', prompt: 'beautiful curvy voluptuous woman, upper body portrait, sensual pose, soft warm lighting, dark background, photorealistic' },
  { category: 'bodytype', id: 'bbw', prompt: 'beautiful plus-size BBW woman, upper body portrait, confident pose, soft warm lighting, dark background, photorealistic' },

  // Breast sizes
  { category: 'breastsize', id: 'small', prompt: 'beautiful woman with small petite breasts, upper body portrait, elegant pose, soft warm lighting, dark background, photorealistic' },
  { category: 'breastsize', id: 'medium', prompt: 'beautiful woman with medium natural breasts, upper body portrait, elegant pose, soft warm lighting, dark background, photorealistic' },
  { category: 'breastsize', id: 'large', prompt: 'beautiful woman with large full breasts, upper body portrait, sensual pose, soft warm lighting, dark background, photorealistic' },
  { category: 'breastsize', id: 'extra_large', prompt: 'beautiful woman with extra large voluptuous breasts, upper body portrait, sensual pose, soft warm lighting, dark background, photorealistic' },
];

async function generateImage(prompt) {
  const body = {
    model: 'lustify-v7',
    prompt: `Highly detailed, photorealistic, sensual, intimate, beautiful woman, soft warm lighting, cinematic: ${prompt}`,
    safe_mode: false,
    hide_watermark: true,
    aspect_ratio: '3:4',
  };

  const res = await fetch('https://api.venice.ai/api/v1/image/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VENICE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Venice API error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const b64 = data.images?.[0] || data.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data in response');
  
  // Strip data URI prefix if present
  const raw = b64.startsWith('data:') ? b64.split(',')[1] : b64;
  return Buffer.from(raw, 'base64');
}

async function uploadToSupabase(path, imageBuffer) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'image/webp',
      'x-upsert': 'true',
    },
    body: imageBuffer,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Upload failed ${res.status}: ${txt}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function main() {
  console.log(`Generating ${IMAGE_SPECS.length} images...\n`);
  const results = {};

  for (let i = 0; i < IMAGE_SPECS.length; i++) {
    const spec = IMAGE_SPECS[i];
    const fileName = `${spec.category}/${spec.id}.webp`;
    console.log(`[${i + 1}/${IMAGE_SPECS.length}] Generating ${fileName}...`);

    try {
      const imageBuffer = await generateImage(spec.prompt);
      const publicUrl = await uploadToSupabase(fileName, imageBuffer);
      console.log(`  -> Uploaded: ${publicUrl}`);
      
      if (!results[spec.category]) results[spec.category] = {};
      results[spec.category][spec.id] = publicUrl;
    } catch (err) {
      console.error(`  !! FAILED: ${err.message}`);
      // Retry once
      try {
        console.log(`  Retrying...`);
        await new Promise(r => setTimeout(r, 2000));
        const imageBuffer = await generateImage(spec.prompt);
        const publicUrl = await uploadToSupabase(fileName, imageBuffer);
        console.log(`  -> Uploaded (retry): ${publicUrl}`);
        if (!results[spec.category]) results[spec.category] = {};
        results[spec.category][spec.id] = publicUrl;
      } catch (err2) {
        console.error(`  !! RETRY FAILED: ${err2.message}`);
      }
    }

    // Small delay between requests
    if (i < IMAGE_SPECS.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log('\n=== URL MAPPING ===');
  console.log(JSON.stringify(results, null, 2));
  console.log('\nDone!');
}

main().catch(console.error);
