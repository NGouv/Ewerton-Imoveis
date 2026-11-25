(() => {
  const VIDEO_MIGRATION = "202611240002_property_videos.sql";
  const platforms = new Set(["youtube", "instagram", "tiktok", "vimeo", "direct"]);

  const parse = (input) => {
    let url;
    try {
      url = new URL(String(input || "").trim());
    } catch (error) {
      throw new Error("Informe um link de vídeo válido.");
    }

    if (url.protocol !== "https:" || url.username || url.password || url.href.length > 2048) {
      throw new Error("Use um endereço HTTPS público e sem credenciais.");
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname;
    const youtubeHosts = new Set(["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"]);
    if (youtubeHosts.has(host)) {
      const videoId = host === "youtu.be"
        ? path.split("/").filter(Boolean)[0]
        : url.searchParams.get("v") || path.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
      if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        throw new Error("O link do YouTube não contém um identificador de vídeo válido.");
      }
      return {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        platform: "youtube",
        label: "YouTube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`
      };
    }

    if (host === "instagram.com" || host === "instagr.am") {
      const match = path.match(/^\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)\/?/);
      if (!match) throw new Error("Use o link direto de uma publicação ou Reel do Instagram.");
      const kind = match[1] === "reels" ? "reel" : match[1];
      return {
        url: `https://www.instagram.com/${kind}/${match[2]}/`,
        platform: "instagram",
        label: "Instagram",
        embedUrl: `https://www.instagram.com/${kind}/${match[2]}/embed/`
      };
    }

    if (["tiktok.com", "m.tiktok.com"].includes(host)) {
      const videoId = path.match(/\/@[^/]+\/video\/(\d+)/)?.[1];
      if (!videoId) throw new Error("Use o link completo do vídeo TikTok para permitir a incorporação.");
      return {
        url: url.href,
        platform: "tiktok",
        label: "TikTok",
        embedUrl: `https://www.tiktok.com/player/v1/${videoId}`
      };
    }

    if (["vm.tiktok.com", "vt.tiktok.com"].includes(host) && /^\/[A-Za-z0-9]+\/?$/.test(path)) {
      return {
        url: url.href,
        platform: "tiktok",
        label: "TikTok · link compartilhado",
        embedUrl: null
      };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const videoId = path.match(/\/(?:video\/)?(\d+)\/?$/)?.[1];
      if (!videoId) throw new Error("O link do Vimeo não contém um identificador de vídeo válido.");
      return {
        url: `https://vimeo.com/${videoId}`,
        platform: "vimeo",
        label: "Vimeo",
        embedUrl: `https://player.vimeo.com/video/${videoId}`
      };
    }

    if (/\.(mp4|webm|ogg)$/i.test(path)) {
      return { url: url.href, platform: "direct", label: "Vídeo hospedado", embedUrl: null };
    }

    throw new Error("Plataforma não compatível. Use YouTube, Instagram, TikTok, Vimeo ou um link direto MP4/WebM/OGG.");
  };

  window.PropertyVideos = Object.freeze({
    platforms,
    migration: VIDEO_MIGRATION,
    parse
  });
})();
