// Test du flux complet : URL Instagram → Service hybride → Génération de recette
const fetch = require('node-fetch');

const INSTAGRAM_SERVICE_URL = 'http://localhost:3004';
const RECIPE_API_URL = 'https://gaby-backend-victor2024-c7b0d533c9ca.herokuapp.com';

async function testFullFlow() {
  console.log('🧪 Test du flux complet Instagram → Recette');
  console.log('=' .repeat(50));
  
  const instagramUrl = 'https://www.instagram.com/p/DOYtAHvCIYt/?hl=fr';
  
  try {
    // Étape 1: Extraire la légende Instagram
    console.log('📱 Étape 1: Extraction de la légende Instagram...');
    const captionResponse = await fetch(`${INSTAGRAM_SERVICE_URL}/api/caption?url=${encodeURIComponent(instagramUrl)}`);
    const captionData = await captionResponse.json();
    
    if (!captionData.success) {
      throw new Error(`Erreur extraction légende: ${captionData.error}`);
    }
    
    console.log('✅ Légende extraite:');
    console.log(`📝 ${captionData.caption.substring(0, 200)}...`);
    console.log(`📊 Longueur: ${captionData.caption.length} caractères`);
    console.log('');
    
    // Étape 2: Générer la recette
    console.log('🍳 Étape 2: Génération de la recette...');
    const recipePayload = {
      platform: 'instagram',
      url: instagramUrl,
      author: 'louloukitchen_',
      caption: captionData.caption,
      thumbnail: null
    };
    
    console.log('📦 Payload envoyé:');
    console.log(`   - Platform: ${recipePayload.platform}`);
    console.log(`   - URL: ${recipePayload.url}`);
    console.log(`   - Author: ${recipePayload.author}`);
    console.log(`   - Caption length: ${recipePayload.caption.length}`);
    console.log('');
    
    // Test avec la vraie URL Heroku
    const possibleUrls = [
      'https://gaby-backend-victor2024-c7b0d533c9ca.herokuapp.com',
      'http://localhost:3000'
    ];
    
    let recipeGenerated = false;
    
    for (const apiUrl of possibleUrls) {
      try {
        console.log(`🔗 Test avec: ${apiUrl}`);
        const recipeResponse = await fetch(`${apiUrl}/generate-recipe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(recipePayload)
        });
        
        if (recipeResponse.ok) {
          const recipeData = await recipeResponse.json();
          console.log('✅ Recette générée avec succès!');
          console.log(`📋 Titre: ${recipeData.title}`);
          console.log(`🥘 Ingrédients: ${recipeData.ingredients.length} éléments`);
          console.log(`👨‍🍳 Instructions: ${recipeData.instructions.length} étapes`);
          console.log('');
          console.log('📝 Premiers ingrédients:');
          recipeData.ingredients.slice(0, 3).forEach((ing, i) => {
            console.log(`   ${i+1}. ${ing.item} ${ing.quantity ? ing.quantity : ''} ${ing.unit || ''}`);
          });
          console.log('');
          console.log('👨‍🍳 Premières instructions:');
          recipeData.instructions.slice(0, 2).forEach((inst, i) => {
            console.log(`   ${i+1}. ${inst.step}`);
          });
          recipeGenerated = true;
          break;
        } else {
          console.log(`❌ Erreur ${recipeResponse.status}: ${recipeResponse.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Erreur de connexion: ${error.message}`);
      }
    }
    
    if (!recipeGenerated) {
      console.log('⚠️ Aucune API de recette disponible');
      console.log('💡 Pour tester complètement, il faut:');
      console.log('   1. La vraie URL de ton serveur Heroku');
      console.log('   2. Ou démarrer le serveur local sur le port 3000');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Lancer le test
testFullFlow();
