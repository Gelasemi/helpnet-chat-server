// IA LOCALE POUR LA CONFIDENTIALITÉ
import * as tf from '@tensorflow/tfjs';

export class LocalAIEngine {
  constructor() {
    this.models = {};
    this.loadModels();
  }

  async loadModels() {
    // Charge modèle de classification des besoins
    this.models.helpClassifier = await tf.loadLayersModel('/models/help-classifier.json');
    
    // Charge modèle de prédiction d'urgence
    this.models.urgencyPredictor = await tf.loadLayersModel('/models/urgency-predictor.json');
  }

  async analyzeHelpRequest(text, imageData = null) {
    // Vectorise le texte
    const textTensor = this.vectorizeText(text);
    
    // Si image, extrait features
    let imageTensor = tf.zeros([1, 224, 224, 3]);
    if (imageData) {
      imageTensor = this.preprocessImage(imageData);
    }

    // Combine features
    const combined = tf.concat([textTensor, imageTensor.flatten()]);

    // Prédit catégorie
    const categoryPrediction = this.models.helpClassifier.predict(combined);
    const categories = ['food', 'health', 'shelter', 'education', 'climate', 'finance'];
    const category = categories[categoryPrediction.argMax(-1).dataSync()[0]];

    // Prédit urgence (0-10)
    const urgencyPrediction = this.models.urgencyPredictor.predict(combined);
    const urgency = Math.min(10, Math.max(1, urgencyPrediction.dataSync()[0] * 10));

    // Libère mémoire
    tf.dispose([textTensor, imageTensor, combined, categoryPrediction, urgencyPrediction]);

    return {
      category,
      urgency: Math.round(urgency),
      confidence: categoryPrediction.max().dataSync()[0]
    };
  }

  vectorizeText(text) {
    // Simple bag-of-words pour mobile
    const vocabulary = 10000;
    const tensor = tf.zeros([1, vocabulary]);
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      const hash = this.hashWord(word) % vocabulary;
      tensor.buffer().set(1, 0, hash);
    });

    return tensor;
  }

  hashWord(word) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = word.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  async matchHelpers(needId, userLocation) {
    // Requête Supabase vectorielle
    const { data: helpers } = await supabase.rpc('find_nearby_helpers', {
      need_location: userLocation,
      max_distance_km: 10,
      skills: needId.category,
      limit: 20
    });

    // Score par IA
    return helpers.map(h => ({
      ...h,
      matchScore: this.calculateMatchScore(h, needId)
    })).sort((a, b) => b.matchScore - a.matchScore);
  }

  calculateMatchScore(helper, need) {
    let score = 0;
    
    // Proximité (40%)
    score += (1 - (helper.distance_km / 10)) * 0.4;
    
    // Compétences (30%)
    const skillMatch = helper.skills?.includes(need.category) ? 1 : 0;
    score += skillMatch * 0.3;
    
    // Disponibilité (20%)
    score += (helper.availability_score || 0) * 0.2;
    
    // Karma (10%)
    score += (helper.karma_score || 0) / 1000 * 0.1;
    
    return Math.round(score * 100);
  }
}

export const aiEngine = new LocalAIEngine();