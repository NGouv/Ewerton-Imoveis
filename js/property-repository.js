(() => {
  const config = window.SUPABASE_CONFIG || {};
  const hasConfig = Boolean(config.url && config.anonKey);
  let client = null;
  const ready = (async () => {
    if (!hasConfig) return false;
    if (!window.supabase) {
      await new Promise((resolve, reject) => {
        const sdk = document.createElement("script");
        sdk.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        sdk.onload = resolve;
        sdk.onerror = () => reject(new Error("Não foi possível carregar o SDK do Supabase. Verifique a conexão com a internet."));
        document.head.append(sdk);
      });
    }
    if (!window.supabase) throw new Error("O SDK do Supabase não ficou disponível.");
    client = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.sessionStorage
      }
    })
    return true;
  })();

  const ensureClient = () => {
    if (!client) throw new Error("O Supabase ainda não foi configurado.");
    return client;
  };

  const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
  };

  window.PropertyRepository = Object.freeze({
    ready,
    get isConfigured() { return Boolean(client); },
    auth: {
      async signIn(email, password) {
        const { data, error } = await ensureClient().auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
      },
      async signOut() {
        const { error } = await ensureClient().auth.signOut();
        if (error) throw error;
      },
      async getSession() {
        const { data, error } = await ensureClient().auth.getSession();
        if (error) throw error;
        return data.session;
      },
      async getAuthorizedUser() {
        const user = (await this.getSession())?.user;
        if (!user) return null;
        const data = unwrap(await ensureClient()
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle());
        return data ? user : null;
      }
    },
    async listAdminProperties() {
      return unwrap(await ensureClient()
        .from("properties")
        .select("*, property_images(*), property_private_addresses(*)")
        .order("created_at", { ascending: false }));
    },
    async listPublicProperties() {
      return unwrap(await ensureClient()
        .from("properties")
        .select("id,title,description,property_type,purpose,status,price,condo_fee,property_tax,state,city,neighborhood,total_area,private_area,bedrooms,suites,bathrooms,parking_spaces,features,is_published,created_at,updated_at,property_images(*)")
        .eq("is_published", true)
        .order("created_at", { ascending: false }));
    },
    async getPublicProperty(id) {
      return unwrap(await ensureClient()
        .from("properties")
        .select("id,title,description,property_type,purpose,status,price,condo_fee,property_tax,state,city,neighborhood,total_area,private_area,bedrooms,suites,bathrooms,parking_spaces,features,is_published,created_at,updated_at,property_images(*)")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle());
    },
    async saveProperty(property, imageItems) {
      const supabase = ensureClient();
      const propertyId = property.id || crypto.randomUUID();
      const uploadedPaths = [];
      let imageRowsSaved = false;

      try {
        const images = [];
        for (const [index, image] of imageItems.entries()) {
          let path = image.storage_path;
          if (image.file) {
            const extensionByType = {
              "image/jpeg": "jpg",
              "image/png": "png",
              "image/webp": "webp"
            };
            const extension = extensionByType[image.file.type];
            if (!extension) throw new Error("Formato de imagem não permitido.");
            path = `${propertyId}/${crypto.randomUUID()}.${extension}`;
            const { error } = await supabase.storage
              .from("property-images")
              .upload(path, image.file, { contentType: image.file.type, upsert: false });
            if (error) throw error;
            uploadedPaths.push(path);
          }
          images.push({
            id: image.id || crypto.randomUUID(),
            property_id: propertyId,
            storage_path: path,
            alt_text: image.alt_text || property.title,
            display_order: index,
            is_cover: index === Number(property.cover_index)
          });
        }

        const { removedImages, cover_index, private_address = {}, ...propertyRecord } = property;
        unwrap(await supabase.from("properties").upsert({ ...propertyRecord, id: propertyId }));
        const hasPrivateAddress = Object.values(private_address).some(Boolean);
        if (hasPrivateAddress) {
          unwrap(await supabase.from("property_private_addresses")
            .upsert({ ...private_address, property_id: propertyId }));
        } else {
          unwrap(await supabase.from("property_private_addresses")
            .delete()
            .eq("property_id", propertyId));
        }
        if (images.length || property.removedImages?.length) {
          unwrap(await supabase.from("property_images")
            .update({ is_cover: false })
            .eq("property_id", propertyId));
        }
        if (property.removedImages?.length) {
          const removedIds = property.removedImages.map((image) => image.id);
          unwrap(await supabase.from("property_images").delete().in("id", removedIds));
        }
        if (images.length) unwrap(await supabase.from("property_images").upsert(images));
        imageRowsSaved = true;

        if (property.removedImages?.length) {
          const pathsToRemove = property.removedImages.map((image) => image.storage_path);
          if (pathsToRemove.length) {
            const { error } = await supabase.storage.from("property-images").remove(pathsToRemove);
            if (error) throw new Error(`O imóvel foi salvo, mas não foi possível limpar imagens removidas do Storage: ${error.message}`);
          }
        }
        return propertyId;
      } catch (error) {
        if (uploadedPaths.length && !imageRowsSaved) {
          const { error: cleanupError } = await supabase.storage.from("property-images").remove(uploadedPaths);
          if (cleanupError) {
            throw new Error(`${error.message}. Também não foi possível limpar imagens enviadas: ${cleanupError.message}`);
          }
        }
        throw error;
      }
    },
    async deleteProperty(property) {
      const supabase = ensureClient();
      unwrap(await supabase.from("properties").delete().eq("id", property.id));
      const paths = (property.property_images || []).map((image) => image.storage_path);
      if (paths.length) {
        const { error } = await supabase.storage.from("property-images").remove(paths);
        if (error) throw new Error(`O registro foi excluído, mas não foi possível limpar algumas imagens do Storage: ${error.message}`);
      }
    },
    publicImageUrl(path) {
      const { data } = ensureClient().storage.from("property-images").getPublicUrl(path);
      return data.publicUrl;
    }
  });
})();
