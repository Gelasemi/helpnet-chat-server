import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

async function setupDatabase() {
  console.log('🚀 Configuration de HELPNET Supabase...');

  // Active PostGIS
  await supabase.rpc('exec_sql', { 
    sql: 'CREATE EXTENSION IF NOT EXISTS postgis;'
  });

  // Tables principales
  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS helps (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id),
      type TEXT CHECK (type IN ('food', 'health', 'shelter', 'education', 'climate', 'finance', 'urgent')),
      urgency INTEGER CHECK (urgency >= 1 AND urgency <= 10),
      title TEXT NOT NULL,
      description TEXT,
      location GEOGRAPHY(Point, 4326),
      status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
      ai_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_helps_location ON helps USING GIST(location);
    CREATE INDEX idx_helps_status ON helps(status);
  `});

  await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS social_connections (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id),
      provider TEXT NOT NULL,
      external_id TEXT NOT NULL,
      access_token TEXT ENCRYPTED,
      refresh_token TEXT ENCRYPTED,
      expires_at TIMESTAMPTZ,
      UNIQUE(user_id, provider)
    );
  `});

  // Fonctions
  await supabase.rpc('exec_sql', { sql: `
    CREATE OR REPLACE FUNCTION find_nearby_helpers(
      need_location GEOGRAPHY,
      max_distance_km FLOAT,
      need_type TEXT,
      limit_count INTEGER
    ) RETURNS TABLE (
      id UUID,
      distance_km FLOAT,
      skills TEXT[],
      karma_score FLOAT,
      availability_score FLOAT
    ) AS $$
      SELECT 
        u.id,
        ST_Distance(u.location, need_location) / 1000 AS distance_km,
        u.skills,
        u.karma_score,
        u.preferences->>'availability' AS availability_score
      FROM users u
      WHERE ST_DWithin(u.location, need_location, max_distance_km * 1000)
      ORDER BY distance_km ASC
      LIMIT limit_count;
    $$ LANGUAGE SQL;
  `});

  console.log('✅ HELPNET configuré avec succès !');
}

setupDatabase().catch(console.error);