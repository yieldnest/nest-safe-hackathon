-- Up Migration
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS generated_images (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "filename" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Url" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "embedding" vector(1024),
    "agentId" UUID REFERENCES accounts("id"),
    "userId" UUID REFERENCES accounts("id"),
    CONSTRAINT fk_agent FOREIGN KEY ("agentId") REFERENCES accounts("id") ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES accounts("id") ON DELETE CASCADE
);

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS "userAddress" TEXT,
ADD COLUMN IF NOT EXISTS "safeAddress" TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_generated_images_embedding ON generated_images USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_generated_images_agent ON generated_images("agentId");
CREATE INDEX IF NOT EXISTS idx_generated_images_user ON generated_images("userId");
CREATE INDEX IF NOT EXISTS idx_generated_images_created ON generated_images("createdAt");

ALTER TABLE accounts 
DROP COLUMN IF EXISTS "userAddress",
DROP COLUMN IF EXISTS "safeAddress";

-- Down Migration
DROP TABLE IF EXISTS generated_images CASCADE;