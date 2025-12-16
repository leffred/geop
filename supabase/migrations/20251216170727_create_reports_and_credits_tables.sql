-- create_reports_and_credits_tables.sql

-- La méthode gen_random_uuid() est reconnue nativement et est plus stable dans les migrations
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Cette extension contient gen_random_uuid()

-- 1. Table des rapports (Historique des analyses)
CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- CHANGEMENT CRITIQUE
    user_email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    keyword text NOT NULL,
    brand text NOT NULL,
    analysis_data jsonb
);

-- 2. Table des crédits (Pour la monétisation)
CREATE TABLE credits (
    user_email text PRIMARY KEY NOT NULL,
    balance int NOT NULL DEFAULT 5,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);