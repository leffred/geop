const handleConnect = (service: 'gsc' | 'ga4') => {
  const clientId = "VOTRE_CLIENT_ID_GOOGLE"; // À récupérer sur Google Cloud Console
  const redirectUri = encodeURIComponent("https://fredericlefebvre.app.n8n.cloud/webhook/auth-google-callback");
  
  // Scopes adaptés selon le service
  const scope = service === 'gsc' 
    ? "https://www.googleapis.com/auth/webmasters.readonly" 
    : "https://www.googleapis.com/auth/analytics.readonly";
    
  // On ajoute access_type=offline pour obtenir le refresh_token (jeton permanent)
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  
  window.location.href = authUrl;
};