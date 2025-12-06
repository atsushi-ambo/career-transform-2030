import express from 'express';
import cors from 'cors';
import { images, initializeContextFromFiles, getFileObject, MulmoScriptMethods, movie } from 'mulmocast';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Output directory for generated files
const OUTPUT_BASE = path.join(__dirname, '../output');
if (!fs.existsSync(OUTPUT_BASE)) {
  fs.mkdirSync(OUTPUT_BASE, { recursive: true });
}

// Serve generated files
app.use('/output', express.static(OUTPUT_BASE));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate images from MulmoScript
app.post('/api/generate/images', async (req, res) => {
  const { mulmoScript } = req.body;

  if (!mulmoScript) {
    return res.status(400).json({ error: 'mulmoScript is required' });
  }

  const jobId = `job_${Date.now()}`;
  const outputDir = path.join(OUTPUT_BASE, jobId);
  const scriptPath = path.join(outputDir, 'script.json');

  try {
    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });

    // Save script to temp file
    fs.writeFileSync(scriptPath, JSON.stringify(mulmoScript, null, 2));

    console.log(`[${jobId}] Starting image generation...`);
    console.log(`[${jobId}] Output dir: ${outputDir}`);
    console.log(`[${jobId}] Script path: ${scriptPath}`);

    // Initialize context
    const files = getFileObject({
      basedir: outputDir,
      outdir: outputDir,
      file: scriptPath
    });

    const context = await initializeContextFromFiles(files, false, false, false);

    // Generate images
    await images(context);

    // Find generated images
    const generatedFiles = fs.readdirSync(outputDir)
      .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
      .map(f => `/output/${jobId}/${f}`);

    console.log(`[${jobId}] Generated ${generatedFiles.length} images`);

    res.json({
      success: true,
      jobId,
      images: generatedFiles,
      outputPath: `/output/${jobId}`
    });

  } catch (error) {
    console.error(`[${jobId}] Error:`, error);
    res.status(500).json({
      error: error.message,
      jobId
    });
  }
});

// Generate single image for a beat (faster for demo)
app.post('/api/generate/image', async (req, res) => {
  const { prompt, beatIndex = 0 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const jobId = `img_${Date.now()}`;
  const outputDir = path.join(OUTPUT_BASE, jobId);

  try {
    fs.mkdirSync(outputDir, { recursive: true });

    // Create minimal MulmoScript for single image
    const singleBeatScript = {
      "$mulmocast": { "version": "1.0" },
      "canvasSize": { "width": 1920, "height": 1080 },
      "htmlImageParams": { "provider": "anthropic" },
      "title": "Single Image Generation",
      "lang": "ja",
      "beats": [{
        "text": "",
        "htmlPrompt": { "prompt": prompt }
      }]
    };

    const scriptPath = path.join(outputDir, 'script.json');
    fs.writeFileSync(scriptPath, JSON.stringify(singleBeatScript, null, 2));

    console.log(`[${jobId}] Generating single image...`);

    const files = getFileObject({
      basedir: outputDir,
      outdir: outputDir,
      file: scriptPath
    });

    const context = await initializeContextFromFiles(files, false, false, false);
    await images(context);

    const generatedFiles = fs.readdirSync(outputDir)
      .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
      .map(f => `/output/${jobId}/${f}`);

    res.json({
      success: true,
      jobId,
      imageUrl: generatedFiles[0] || null
    });

  } catch (error) {
    console.error(`[${jobId}] Error:`, error);
    res.status(500).json({ error: error.message, jobId });
  }
});

// Generate movie from MulmoScript
app.post('/api/generate/movie', async (req, res) => {
  const { mulmoScript } = req.body;

  if (!mulmoScript) {
    return res.status(400).json({ error: 'mulmoScript is required' });
  }

  const jobId = `movie_${Date.now()}`;
  const outputDir = path.join(OUTPUT_BASE, jobId);
  const scriptPath = path.join(outputDir, 'script.json');

  try {
    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });

    // Save script to temp file
    fs.writeFileSync(scriptPath, JSON.stringify(mulmoScript, null, 2));

    console.log(`[${jobId}] Starting movie generation...`);
    console.log(`[${jobId}] Output dir: ${outputDir}`);
    console.log(`[${jobId}] Script path: ${scriptPath}`);

    // Initialize context
    const files = getFileObject({
      basedir: outputDir,
      outdir: outputDir,
      file: scriptPath
    });

    // Enable narration for movie generation
    let context = await initializeContextFromFiles(files, true, false, false);

    // Generate audio first (required for duration calculation)
    console.log(`[${jobId}] Generating audio narration...`);
    const { audio } = await import('mulmocast');
    const audioResult = await audio(context);

    // CRITICAL: audio() returns updated context with durations set
    // We must use this updated context for subsequent operations
    context = audioResult;

    // Generate images
    console.log(`[${jobId}] Generating images...`);
    await images(context);

    // Generate movie using mulmocast library (now context has durations!)
    console.log(`[${jobId}] Generating movie from images and audio...`);
    await movie(context);

    // Find generated movie
    const movieFiles = fs.readdirSync(outputDir)
      .filter(f => f.endsWith('.mp4') || f.endsWith('.mov'));

    if (movieFiles.length === 0) {
      throw new Error('Movie file was not generated');
    }

    const movieFile = movieFiles[0];
    console.log(`[${jobId}] Movie generated successfully: ${movieFile}`);

    res.json({
      success: true,
      jobId,
      movieUrl: `/output/${jobId}/${movieFile}`,
      outputPath: `/output/${jobId}`
    });

  } catch (error) {
    console.error(`[${jobId}] Error:`, error);
    res.status(500).json({
      error: error.message,
      jobId
    });
  }
});

app.listen(PORT, () => {
  console.log(`MulmoCast API server running on http://localhost:${PORT}`);
  console.log(`Output directory: ${OUTPUT_BASE}`);
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY ? 'Set' : 'Not set'}`);
});
