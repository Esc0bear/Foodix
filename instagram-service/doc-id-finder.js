import 'dotenv/config';
import fetch from 'node-fetch';

// Script pour découvrir des doc_id Instagram valides
class InstagramDocIdFinder {
  constructor() {
    this.knownDocIds = [
      '10015901848480474',
      '8845758991822021', 
      '8845757868488799',
      '17841400041260044',
      '17888483320059182'
    ];
    
    this.workingDocIds = [];
    this.testShortcodes = [
      'DOd2EcviIiC',
      'CKuR3hpFpTQ', 
      'CLCrPtRHeFl'
    ];
  }

  async testDocId(docId, shortcode) {
    const variables = encodeURIComponent(JSON.stringify({ shortcode }));
    const body = `variables=${variables}&doc_id=${docId}`;
    
    try {
      const response = await fetch('https://www.instagram.com/api/graphql', {
        method: 'POST',
        headers: { 
          'content-type': 'application/x-www-form-urlencoded',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'x-requested-with': 'XMLHttpRequest',
          'referer': 'https://www.instagram.com/'
        },
        body
      });
      
      const text = await response.text();
      
      // Vérifier si c'est du JSON valide
      if (text.trim().startsWith('{')) {
        const json = JSON.parse(text);
        const hasData = json?.data?.xdt_shortcode_media || json?.data?.shortcode_media;
        
        if (hasData) {
          console.log(`✅ Doc ID ${docId} fonctionne avec ${shortcode}`);
          return { docId, working: true, response: json };
        }
      }
      
      console.log(`❌ Doc ID ${docId} ne fonctionne pas avec ${shortcode}`);
      return { docId, working: false };
      
    } catch (error) {
      console.log(`❌ Erreur avec doc ID ${docId}:`, error.message);
      return { docId, working: false, error: error.message };
    }
  }

  async findWorkingDocIds() {
    console.log('🔍 Recherche de doc_id Instagram valides...\n');
    
    for (const shortcode of this.testShortcodes) {
      console.log(`\n📱 Test avec shortcode: ${shortcode}`);
      
      for (const docId of this.knownDocIds) {
        const result = await this.testDocId(docId, shortcode);
        
        if (result.working && !this.workingDocIds.includes(docId)) {
          this.workingDocIds.push(docId);
        }
        
        // Pause pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n🎯 Doc IDs valides trouvés: ${this.workingDocIds.join(', ')}`);
    return this.workingDocIds;
  }
}

// Exécution
const finder = new InstagramDocIdFinder();
finder.findWorkingDocIds().then(workingIds => {
  if (workingIds.length > 0) {
    console.log('\n✅ Mise à jour du fichier .env...');
    console.log(`IG_DOC_IDS=${workingIds.join(',')}`);
  } else {
    console.log('\n❌ Aucun doc_id valide trouvé');
  }
}).catch(console.error);
