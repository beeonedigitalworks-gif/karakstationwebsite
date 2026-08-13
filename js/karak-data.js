/* Karak Station database adapter. Supabase is the source of truth. */
(function () {
  const ready = () => new Promise((resolve, reject) => {
    if (window.karakSupabase) return resolve(window.karakSupabase);
    const timer = setTimeout(() => reject(new Error('Supabase client is not configured.')), 10000);
    window.addEventListener('karak-supabase-ready', () => { clearTimeout(timer); resolve(window.karakSupabase); }, { once: true });
  });
  const fail = (error) => { console.error('Karak Station database error:', error); throw error; };

  async function client() { return ready(); }

  window.KarakDB = {
    async getMenu() {
      const s = await client();
      const [c, f] = await Promise.all([
        s.from('categories').select('*').order('sort_order').order('name'),
        s.from('foods').select('*').order('sort_order').order('name')
      ]);
      if (c.error) fail(c.error); if (f.error) fail(f.error);
      return {
        categories: (c.data || []).map(x => x.name),
        foods: (f.data || []).map(x => ({ id:x.legacy_id || x.id, name:x.name, arabicName:x.arabic_name, arabicConfirmed:x.arabic_confirmed, amount:x.amount, image:x.image || x.image_url || '', imageData:x.image_url || x.image || '', category:x.category, description:x.description, desc:x.description, status:x.status || (x.is_available === false ? 'unavailable' : 'available') }))
      };
    },
    async saveMenu(categories, foods) {
      const s = await client();
      const { error: de } = await s.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (de) fail(de);
      const { error: df } = await s.from('foods').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (df) fail(df);
      if (categories.length) {
        const { error } = await s.from('categories').insert(categories.map((name,i)=>({name,sort_order:i})));
        if (error) fail(error);
      }
      if (foods.length) {
        const { error } = await s.from('foods').insert(foods.map((f,i)=>({legacy_id:String(f.id || ''),name:f.name||'',arabic_name:f.arabicName||'',arabic_confirmed:!!f.arabicConfirmed,amount:f.amount||'',image:f.image||'',image_url:f.imageData||'',category:f.category||'',description:f.description||f.desc||'',status:f.status||'available',sort_order:i})));
        if (error) fail(error);
      }
    },
    async getSpecialFoods() {
      const s = await client(); const {data,error}=await s.from('special_foods').select('*').order('sort_order').order('name'); if(error) fail(error);
      return (data||[]).map(x=>({id:x.legacy_id||x.id,name:x.name,arabicName:x.arabic_name,desc:x.description,description:x.description,price:x.price,image:x.image,imageData:x.image_url||'',status:x.status}));
    },
    async saveSpecialFoods(items) {
      const s=await client(); const {error:de}=await s.from('special_foods').delete().neq('id','00000000-0000-0000-0000-000000000000'); if(de) fail(de);
      if(items.length){const {error}=await s.from('special_foods').insert(items.map((f,i)=>({legacy_id:String(f.id||''),name:f.name||'',arabic_name:f.arabicName||'',description:f.description||f.desc||'',price:f.price||'',image:f.image||'',image_url:f.imageData||'',status:f.status||'available',sort_order:i})));if(error)fail(error);}
    },
    async getBlog() {
      const s=await client(); const [c,p]=await Promise.all([s.from('blog_categories').select('*').order('sort_order').order('name'),s.from('blog_posts').select('*').order('post_date',{ascending:false}).order('created_at',{ascending:false})]); if(c.error)fail(c.error);if(p.error)fail(p.error);
      return {categories:(c.data||[]).map(x=>x.name),posts:(p.data||[]).map(x=>({id:x.legacy_id||x.id,title:x.title,date:x.post_date,category:x.category,image:x.image,imageUrl:x.image_url,likes:x.likes,comments:x.comments,commentList:x.comment_list||[],link:x.link,excerpt:x.excerpt,content:x.content}))};
    },
    async saveBlog(categories,posts){const s=await client(); let r=await s.from('blog_categories').delete().neq('id','00000000-0000-0000-0000-000000000000');if(r.error)fail(r.error);r=await s.from('blog_posts').delete().neq('id','00000000-0000-0000-0000-000000000000');if(r.error)fail(r.error);if(categories.length){r=await s.from('blog_categories').insert(categories.map((name,i)=>({name,sort_order:i})));if(r.error)fail(r.error);}if(posts.length){r=await s.from('blog_posts').insert(posts.map((p,i)=>({legacy_id:String(p.id||''),title:p.title||'',post_date:p.date||null,category:p.category||'',image:p.image||'',image_url:p.imageUrl||'',likes:Number(p.likes||0),comments:Number(p.comments||0),comment_list:Array.isArray(p.commentList)?p.commentList:[],link:p.link||'',excerpt:p.excerpt||'',content:p.content||'',created_at:new Date(Date.now()+i).toISOString()})));if(r.error)fail(r.error);}},
    async getSetting(key, fallback={}){const s=await client();const {data,error}=await s.from('site_settings').select('value').eq('key',key).maybeSingle();if(error)fail(error);return data?.value||fallback;},
    async saveSetting(key,value){const s=await client();const {error}=await s.from('site_settings').upsert({key,value,updated_at:new Date().toISOString()});if(error)fail(error);},
    async createOrder(order){const s=await client();const {data,error}=await s.from('orders').insert({legacy_id:order.id?String(order.id):null,customer_name:order.customerName||order.customer||'',customer_country_code:order.customerCountryCode||'+974',customer_phone_number:order.customerPhoneNumber||order.customerPhone||'',order_type:order.orderType||'whatsapp',items:order.items||order.foods||[],total:order.total||'',message:order.message||'',status:order.status||'pending',source:order.source||'website',special_poster:!!order.specialPoster}).select().single();if(error)fail(error);return data;},
    async getOrders(){const s=await client();const {data,error}=await s.from('orders').select('*').order('created_at',{ascending:false});if(error)fail(error);return data||[];},
    async updateOrder(id, patch){const s=await client();const {error}=await s.from('orders').update({...patch,updated_at:new Date().toISOString()}).eq('id',id);if(error)fail(error);},
    async deleteOrder(id){const s=await client();const {error}=await s.from('orders').delete().eq('id',id);if(error)fail(error);},
    async uploadImage(file, folder='uploads'){const s=await client();const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${folder}/${Date.now()}-${safe}`;const {error}=await s.storage.from('karak-images').upload(path,file,{upsert:false});if(error)fail(error);return s.storage.from('karak-images').getPublicUrl(path).data.publicUrl;},
    async session(){const s=await client();return (await s.auth.getSession()).data.session;},
    async signIn(email,password){const s=await client();const {data,error}=await s.auth.signInWithPassword({email,password});if(error)fail(error);return data;},
    async signOut(){const s=await client();const {error}=await s.auth.signOut();if(error)fail(error);},
    async adminProfile(){const s=await client();const session=await this.session();if(!session)return null;const {data,error}=await s.from('admin_profiles').select('*').eq('id',session.user.id).maybeSingle();if(error)fail(error);return data;}
  };
})();
