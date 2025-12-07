// Generate presentation slides using the server endpoint
import fs from 'fs';
import path from 'path';

async function generatePresentation() {
  console.log('🎯 Starting presentation generation...');
  const startTime = Date.now();

  try {
    // Read the MulmoScript
    const scriptPath = path.join(process.cwd(), 'presentation', 'hackathon-presentation.json');
    console.log(`📄 Loading MulmoScript from: ${scriptPath}`);

    const mulmoScript = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));
    console.log(`📊 Total slides: ${mulmoScript.beats.length}`);

    // Generate images via server endpoint
    console.log('\n🎨 Generating slide images...');
    const imagesResponse = await fetch('http://localhost:3002/api/generate/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mulmoScript })
    });

    if (!imagesResponse.ok) {
      const errorText = await imagesResponse.text();
      throw new Error(`Images generation failed: ${imagesResponse.status} - ${errorText}`);
    }

    const imagesResult = await imagesResponse.json();
    console.log('✅ Slide images generated');
    console.log(`   Job ID: ${imagesResult.jobId}`);
    console.log(`   Images available at: ${imagesResult.imageUrls.length} slides`);

    // Generate movie with narration via server endpoint
    console.log('\n🎬 Generating presentation movie with narration...');
    const movieResponse = await fetch('http://localhost:3002/api/generate/movie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mulmoScript })
    });

    if (!movieResponse.ok) {
      const errorText = await movieResponse.text();
      throw new Error(`Movie generation failed: ${movieResponse.status} - ${errorText}`);
    }

    const movieResult = await movieResponse.json();
    console.log('✅ Presentation movie generated');
    console.log(`   Job ID: ${movieResult.jobId}`);
    console.log(`   Movie URL: ${movieResult.movieUrl}`);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('🎉 PRESENTATION GENERATION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(`📊 Total slides: ${mulmoScript.beats.length}`);
    console.log(`\n📁 Images Job: ${imagesResult.jobId}`);
    console.log(`📁 Movie Job: ${movieResult.jobId}`);
    console.log(`\n📽️  View your presentation:`);
    console.log(`   Movie: http://localhost:3002${movieResult.movieUrl}`);
    console.log(`   Slides: http://localhost:3002/output/${movieResult.jobId}/images/script/`);
    console.log('\n💡 Individual slide images (PNG):');
    imagesResult.imageUrls.forEach((url, i) => {
      console.log(`   Slide ${i + 1}: http://localhost:3002${url}`);
    });
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ GENERATION FAILED');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

generatePresentation();
