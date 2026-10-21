document.documentElement.classList.add('js');
try{ if(!sessionStorage.getItem('atl-boot') && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('booting'); }catch(e){}
