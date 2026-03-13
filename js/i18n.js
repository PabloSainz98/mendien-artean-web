/* ============================================
   MENDIEN ARTEAN — i18n Translation System
   ============================================ */

const translations = {
  es: {
    // Navbar
    'nav.about': 'El complejo',
    'nav.services': 'Servicios',
    'nav.availability': 'Disponibilidad',
    'nav.activities': 'Actividades',
    'nav.products': 'Productos',
    'nav.gallery': 'Galería',
    'nav.contact': 'Contacto',
    'nav.book': 'Reservar',

    // Hero
    'hero.badge': 'Igorre, Euskadi',
    'hero.title': '<em>UXARBEITI Baserria</em>',
    'hero.subtitle': 'Complejo rural familiar entre los parques naturales de Urkiola y Gorbeia.<br>Domo Gorbeia y Urkiola Etxea en plena naturaleza.',
    'hero.cta1': 'Reservar ahora',
    'hero.cta2': 'Descubre el complejo',
    'hero.pricefrom': 'desde',
    'hero.pricenight': '/noche',

    // About
    'about.title': 'Un complejo rural entre montañas',
    'about.p1': '<strong>UXARBEITI Baserria</strong> es un complejo rural familiar situado en el corazón del País Vasco, entre los impresionantes parques naturales de <strong>Urkiola</strong> y <strong>Gorbeia</strong>.',
    'about.p2': 'El complejo reúne dos experiencias complementarias: <strong>Urkiola Etxea</strong> y <strong>Domo Gorbeia</strong>, para desconectar con comodidad, paisaje y autenticidad rural.',
    'about.feat1': 'Dos alojamientos en un mismo complejo',
    'about.feat2': 'Domo Gorbeia + Urkiola Etxea',
    'about.feat3': 'Entre Urkiola y Gorbeia',
    'about.feat4': 'Turismo rural y producto local',
    'about.pricenote': 'Reserva directa de alojamientos y experiencias del complejo',
    'about.bookdirect': 'Solicitar reserva →',

    // UXARBEITI Story
    'uxa.title': 'Historia de UXARBEITI Baserria',
    'uxa.subtitle': 'Proyecto familiar agrícola y rural con décadas de trayectoria en Bizkaia',
    'uxa.p1': 'Uxarbeiti Baserria es una explotación familiar formada por Urtza Sarrionandia y sus padres, Edurtzeta Atutxa e Iñaki Sarrionandia.',
    'uxa.p2': 'Nació en los años 80 y se amplió en 2008 y 2013, con actividad en dos caseríos: Uxarbeiti e Iauribarrigoikoan Behekoa.',
    'uxa.p3': 'Hoy combina alojamiento rural con producción agrícola: frutas, verduras de temporada, conservas artesanales y venta local.',
    'uxa.timeline.title': 'Hitos',
    'uxa.timeline.1': 'Años 80: creación de la explotación familiar',
    'uxa.timeline.2': '2008: primera ampliación de la explotación',
    'uxa.timeline.3': '2013: ampliación principal y consolidación',
    'uxa.stats.title': 'Datos clave',
    'uxa.stats.1': '5000 m2 de huerta en campo abierto',
    'uxa.stats.2': '1 ha de manzanos',
    'uxa.stats.3': '1,8 ha de kiwis',
    'uxa.stats.4': '250 gallinas',
    'uxa.recognition': 'Explotación reconocida en Bizkaia y Gipuzkoa, con presencia en ferias BBK y comercialización local en Arratia y Amorebieta.',

    // Services
    'services.title': 'Servicios',
    'services.subtitle': 'Todo lo que necesitas para una estancia cómoda y relajada',
    'svc.kitchen.title': 'Cocina equipada',
    'svc.kitchen.desc': 'Cocina completa con horno, microondas, lavavajillas, frigorífico y cafetera',
    'svc.wifi.title': 'WiFi gratuito',
    'svc.wifi.desc': 'Conexión WiFi de alta velocidad en toda la casa',
    'svc.parking.title': 'Parking privado',
    'svc.parking.desc': 'Aparcamiento gratuito en la propiedad',
    'svc.bbq.title': 'Barbacoa',
    'svc.bbq.desc': 'Zona de barbacoa en el jardín con mesa y sillas',
    'svc.pets.title': 'Mascotas bienvenidas',
    'svc.pets.desc': 'Jardín vallado perfecto para que tus mascotas disfruten',
    'svc.family.title': 'Familiar',
    'svc.family.desc': 'Cuna disponible, ropa de cama y toallas incluidas',

    // Availability
    'avail.title': 'Disponibilidad',
    'avail.subtitle': 'Consulta la disponibilidad y reserva tu estancia',
    'avail.available': 'Disponible',
    'avail.booked': 'Reservado',
    'avail.syncnote': '📅 Disponibilidad actualizada desde Booking.com y Airbnb',
    'price.title': 'Precios por noche',
    'price.low': 'Temporada baja',
    'price.low.dates': 'Enero - Marzo, Noviembre',
    'price.mid': 'Temporada media',
    'price.mid.dates': 'Abril - Junio, Septiembre - Octubre',
    'price.high': 'Temporada alta',
    'price.high.dates': 'Julio - Agosto, Puentes y Festivos',
    'price.night': '/noche',
    'price.bookdirect': '✉️ Reservar ahora',
    'price.bookbooking': 'Booking.com',
    'price.bookairbnb': 'Airbnb',

    // Booking Form
    'booking.title': 'Solicitar Reserva Directa',
    'booking.subtitle': 'Haz tu solicitud y te confirmamos disponibilidad y precio en poco tiempo.',
    'booking.name': 'Nombre completo',
    'booking.email': 'Email',
    'booking.phone': 'Teléfono (WhatsApp)',
    'booking.guests': 'Huéspedes (Max 4)',
    'booking.checkin': 'Fecha de Entrada',
    'booking.checkout': 'Fecha de Salida',
    'booking.message': 'Mensaje / Peticiones / Mascotas',
    'booking.submit': 'Solicitar Presupuesto sin Compromiso',
    'booking.note': 'Nos pondremos en contacto contigo en menos de 24h para confirmar disponibilidad y precio exacto.',
    'booking.success': '✅ Tu cliente de correo se ha abierto con todos los datos. Envía el email para completar la solicitud.',
    'booking.error': 'No se pudo abrir el cliente de correo. Contáctanos directamente por WhatsApp.',

    // Calendar weekdays
    'cal.mon': 'Lun', 'cal.tue': 'Mar', 'cal.wed': 'Mié',
    'cal.thu': 'Jue', 'cal.fri': 'Vie', 'cal.sat': 'Sáb', 'cal.sun': 'Dom',

    // Calendar month names
    'month.0': 'Enero', 'month.1': 'Febrero', 'month.2': 'Marzo',
    'month.3': 'Abril', 'month.4': 'Mayo', 'month.5': 'Junio',
    'month.6': 'Julio', 'month.7': 'Agosto', 'month.8': 'Septiembre',
    'month.9': 'Octubre', 'month.10': 'Noviembre', 'month.11': 'Diciembre',

    // Activities
    'act.title': 'Actividades y alrededores',
    'act.subtitle': 'Descubre todo lo que puedes hacer y ver cerca de UXARBEITI Baserria',
    'act.urkiola.title': 'Parque Natural de Urkiola',
    'act.urkiola.desc': 'Rutas de senderismo espectaculares, el emblemático santuario y vistas impresionantes del Anboto',
    'act.urkiola.dist': '📍 15 min en coche',
    'act.gorbeia.title': 'Parque Natural de Gorbeia',
    'act.gorbeia.desc': 'El techo de Bizkaia con hayedos centenarios, cascadas y la icónica cruz de Gorbeia',
    'act.gorbeia.dist': '📍 20 min en coche',
    'act.bilbao.title': 'Bilbao y Guggenheim',
    'act.bilbao.desc': 'La vibrante capital vizcaína con el museo Guggenheim, pintxos y el Casco Viejo',
    'act.bilbao.dist': '📍 30 min en coche',
    'act.gastro.title': 'Gastronomía vasca',
    'act.gastro.desc': 'Sidrerías, asadores y la mejor gastronomía del mundo a pocos minutos',
    'act.gastro.dist': '📍 En los alrededores',
    'act.beach.title': 'Playas de Bizkaia',
    'act.beach.desc': 'Playa de Bakio, Bermeo, Laga y la espectacular reserva de Urdaibai',
    'act.beach.dist': '📍 40 min en coche',
    'act.cycling.title': 'Ciclismo y BTT',
    'act.cycling.desc': 'Rutas ciclistas por carretera y montaña entre paisajes verdes increíbles',
    'act.cycling.dist': '📍 Desde la puerta',

    // Products
    'products.title': 'Productos del caserío',
    'products.subtitle': 'Producción propia y elaboraciones artesanas de Uxarbeiti Baserria',
    'products.shop.title': 'Tienda BBK Azoka',
    'products.shop.desc': 'Accede a la colección de Uxarbeiti Baserri para ver productos disponibles y comprar online.',
    'products.shop.cta': 'Ver catálogo →',
    'products.fruit.title': 'Fruta y huerta',
    'products.fruit.desc': 'Kiwis, manzanas, higos, membrillos y verduras de temporada cultivadas en la explotación.',
    'products.preserves.title': 'Conservas artesanas',
    'products.preserves.desc': 'Mermeladas, guindillas, cremas y zumos elaborados con producto propio.',
    'products.local.title': 'Venta local',
    'products.local.desc': 'Comercialización en ferias BBK y puntos de venta de Amorebieta y Valle de Arratia.',

    // Gallery
    'gallery.title': 'Galería',
    'gallery.subtitle': 'Echa un vistazo a la casa y sus alrededores',

    // Reviews
    'reviews.title': 'Opiniones',
    'reviews.subtitle': 'Lo que dicen nuestros huéspedes',
    'reviews.cta': 'Ver todas las reseñas en Google',
    'reviews.verified': '✓ Estancia verificada',

    // Contact
    'contact.title': 'Contacto',
    'contact.subtitle': '¿Tienes alguna pregunta? No dudes en contactarnos',
    'contact.how': 'Cómo llegar',
    'contact.how.desc': 'Estamos en Igorre, en el corazón de Bizkaia, a solo 30 minutos de Bilbao y entre dos parques naturales.',
    'contact.location': 'Ubicación',
    'contact.checkin': 'Check-in / Check-out',
    'contact.checkin.val': 'Entrada: 16:00 · Salida: 11:00',
    'contact.reservas': 'Reservas',
    'contact.directions': 'Cómo llegar',
    'contact.directions.link': 'Ver en Google Maps →',

    // Footer
    'footer.desc': 'Complejo rural familiar entre los parques naturales de Urkiola y Gorbeia, con alojamiento y producto local.',
    'footer.sections': 'Secciones',
    'footer.book': 'Reservar',
    'footer.rights': '© 2026 UXARBEITI Baserria. Todos los derechos reservados.',
    'footer.house': 'El complejo',
    'footer.services': 'Servicios',
    'footer.availability': 'Disponibilidad',
    'footer.activities': 'Actividades',
    'footer.products': 'Productos',
    'footer.gallery': 'Galería',
    'footer.contact': 'Contacto',
    'footer.direct': 'Reserva directa',
    'whatsapp.tooltip': '¿Preguntas? Escríbenos',
  },

  en: {
    'nav.about': 'The Complex',
    'nav.services': 'Services',
    'nav.availability': 'Availability',
    'nav.activities': 'Activities',
    'nav.products': 'Products',
    'nav.gallery': 'Gallery',
    'nav.contact': 'Contact',
    'nav.book': 'Book Now',

    'hero.badge': 'Igorre, Basque Country',
    'hero.title': '<em>UXARBEITI Baserria</em>',
    'hero.subtitle': 'Family rural complex between Urkiola and Gorbeia natural parks.<br>Domo Gorbeia and Urkiola Etxea in full nature.',
    'hero.cta1': 'Book now',
    'hero.cta2': 'Discover the complex',
    'hero.pricefrom': 'from',
    'hero.pricenight': '/night',

    'about.title': 'A rural complex in the mountains',
    'about.p1': '<strong>UXARBEITI Baserria</strong> is a family-run rural complex in the heart of the Basque Country, between the stunning natural parks of <strong>Urkiola</strong> and <strong>Gorbeia</strong>.',
    'about.p2': 'The complex brings together two complementary stays: <strong>Urkiola Etxea</strong> and <strong>Domo Gorbeia</strong> for comfort, landscape and authentic rural life.',
    'about.feat1': 'Two stays in one complex',
    'about.feat2': 'Domo Gorbeia + Urkiola Etxea',
    'about.feat3': 'Between Urkiola and Gorbeia',
    'about.feat4': 'Rural tourism and local produce',
    'about.pricenote': 'Direct booking for stays and experiences in the complex',
    'about.bookdirect': 'Request booking →',

    'uxa.title': 'History of UXARBEITI Baserria',
    'uxa.subtitle': 'Family agricultural and rural project with decades of history in Bizkaia',
    'uxa.p1': 'Uxarbeiti Baserria is a family farm run by Urtza Sarrionandia and her parents, Edurtzeta Atutxa and Iñaki Sarrionandia.',
    'uxa.p2': 'It started in the 1980s and was expanded in 2008 and again in 2013, with activity across two farmhouses: Uxarbeiti and Iauribarrigoikoan Behekoa.',
    'uxa.p3': 'Today it combines rural accommodation with farming: fruit, seasonal vegetables, handmade preserves and local sales.',
    'uxa.timeline.title': 'Milestones',
    'uxa.timeline.1': '1980s: creation of the family farm',
    'uxa.timeline.2': '2008: first expansion',
    'uxa.timeline.3': '2013: major expansion and consolidation',
    'uxa.stats.title': 'Key figures',
    'uxa.stats.1': '5000 m2 of open-field vegetable garden',
    'uxa.stats.2': '1 ha of apple trees',
    'uxa.stats.3': '1.8 ha of kiwi fields',
    'uxa.stats.4': '250 hens',
    'uxa.recognition': 'Recognized operation across Bizkaia and Gipuzkoa, present in BBK fairs and local points of sale in Arratia and Amorebieta.',

    'services.title': 'Services',
    'services.subtitle': 'Everything you need for a comfortable and relaxing stay',
    'svc.kitchen.title': 'Equipped kitchen',
    'svc.kitchen.desc': 'Full kitchen with oven, microwave, dishwasher, fridge and coffee maker',
    'svc.wifi.title': 'Free WiFi',
    'svc.wifi.desc': 'High-speed WiFi throughout the house',
    'svc.parking.title': 'Private parking',
    'svc.parking.desc': 'Free parking on the property',
    'svc.bbq.title': 'Barbecue',
    'svc.bbq.desc': 'Barbecue area in the garden with table and chairs',
    'svc.pets.title': 'Pets welcome',
    'svc.pets.desc': 'Fenced garden perfect for your pets to enjoy',
    'svc.family.title': 'Family friendly',
    'svc.family.desc': 'Crib available, bed linen and towels included',

    'avail.title': 'Availability',
    'avail.subtitle': 'Check availability and book your stay',
    'avail.available': 'Available',
    'avail.booked': 'Booked',
    'avail.syncnote': '📅 Availability synced from Booking.com and Airbnb',
    'price.title': 'Prices per night',
    'price.low': 'Low season',
    'price.low.dates': 'January - March, November',
    'price.mid': 'Mid season',
    'price.mid.dates': 'April - June, September - October',
    'price.high': 'High season',
    'price.high.dates': 'July - August, Bank Holidays',
    'price.night': '/night',
    'price.bookdirect': '✉️ Book now',
    'price.bookbooking': 'Booking.com',
    'price.bookairbnb': 'Airbnb',

    'booking.title': 'Direct Booking Request',
    'booking.subtitle': 'Send your request and we will confirm availability and price shortly.',
    'booking.name': 'Full Name',
    'booking.email': 'Email Address',
    'booking.phone': 'Phone Number (WhatsApp)',
    'booking.guests': 'Guests (Max 4)',
    'booking.checkin': 'Check-in Date',
    'booking.checkout': 'Check-out Date',
    'booking.message': 'Message / Special Requests / Pets',
    'booking.submit': 'Request Quote Without Commitment',
    'booking.note': 'We will contact you within 24 hours to confirm availability and exact pricing.',
    'booking.success': '✅ Your email client has opened with all the details. Send the email to complete your request.',
    'booking.error': 'Could not open email client. Please contact us directly via WhatsApp.',

    'cal.mon': 'Mon', 'cal.tue': 'Tue', 'cal.wed': 'Wed',
    'cal.thu': 'Thu', 'cal.fri': 'Fri', 'cal.sat': 'Sat', 'cal.sun': 'Sun',

    'month.0': 'January', 'month.1': 'February', 'month.2': 'March',
    'month.3': 'April', 'month.4': 'May', 'month.5': 'June',
    'month.6': 'July', 'month.7': 'August', 'month.8': 'September',
    'month.9': 'October', 'month.10': 'November', 'month.11': 'December',

    'act.title': 'Activities & surroundings',
    'act.subtitle': 'Discover everything you can do and see near UXARBEITI Baserria',
    'act.urkiola.title': 'Urkiola Natural Park',
    'act.urkiola.desc': 'Spectacular hiking trails, the iconic sanctuary and breathtaking views of Anboto',
    'act.urkiola.dist': '📍 15 min by car',
    'act.gorbeia.title': 'Gorbeia Natural Park',
    'act.gorbeia.desc': 'The rooftop of Bizkaia with centuries-old beech forests, waterfalls and the iconic Gorbeia cross',
    'act.gorbeia.dist': '📍 20 min by car',
    'act.bilbao.title': 'Bilbao & Guggenheim',
    'act.bilbao.desc': 'The vibrant Basque capital with the Guggenheim museum, pintxos and the Old Town',
    'act.bilbao.dist': '📍 30 min by car',
    'act.gastro.title': 'Basque gastronomy',
    'act.gastro.desc': 'Cider houses, grills and world-class cuisine just minutes away',
    'act.gastro.dist': '📍 Nearby',
    'act.beach.title': 'Bizkaia beaches',
    'act.beach.desc': 'Bakio, Bermeo, Laga beaches and the spectacular Urdaibai reserve',
    'act.beach.dist': '📍 40 min by car',
    'act.cycling.title': 'Cycling & MTB',
    'act.cycling.desc': 'Road and mountain cycling routes through incredible green landscapes',
    'act.cycling.dist': '📍 From the doorstep',

    'products.title': 'Farm products',
    'products.subtitle': 'Own production and artisan products from Uxarbeiti Baserria',
    'products.shop.title': 'BBK Azoka shop',
    'products.shop.desc': 'Access the Uxarbeiti Baserri collection to browse available products and buy online.',
    'products.shop.cta': 'View catalog →',
    'products.fruit.title': 'Fruit & orchard',
    'products.fruit.desc': 'Kiwis, apples, figs, quinces and seasonal vegetables grown on the farm.',
    'products.preserves.title': 'Artisan preserves',
    'products.preserves.desc': 'Jams, pickled peppers, creams and juices made with our own produce.',
    'products.local.title': 'Local sales',
    'products.local.desc': 'Sold at BBK fairs and local sales points in Amorebieta and Arratia Valley.',

    'gallery.title': 'Gallery',
    'gallery.subtitle': 'Take a look at the house and its surroundings',

    'reviews.title': 'Reviews',
    'reviews.subtitle': 'What our guests say',
    'reviews.cta': 'See all reviews on Google',
    'reviews.verified': '✓ Verified stay',

    'contact.title': 'Contact',
    'contact.subtitle': 'Have a question? Don\'t hesitate to get in touch',
    'contact.how': 'How to get here',
    'contact.how.desc': 'We\'re in Igorre, in the heart of Bizkaia, just 30 minutes from Bilbao and between two natural parks.',
    'contact.location': 'Location',
    'contact.checkin': 'Check-in / Check-out',
    'contact.checkin.val': 'Check-in: 4:00 PM · Check-out: 11:00 AM',
    'contact.reservas': 'Bookings',
    'contact.directions': 'Directions',
    'contact.directions.link': 'View on Google Maps →',

    'footer.desc': 'Family rural complex between Urkiola and Gorbeia natural parks, with accommodation and local produce.',
    'footer.sections': 'Sections',
    'footer.book': 'Book',
    'footer.rights': '© 2026 UXARBEITI Baserria. All rights reserved.',
    'footer.house': 'The Complex',
    'footer.services': 'Services',
    'footer.availability': 'Availability',
    'footer.activities': 'Activities',
    'footer.products': 'Products',
    'footer.gallery': 'Gallery',
    'footer.contact': 'Contact',
    'footer.direct': 'Book direct',
    'whatsapp.tooltip': 'Questions? Message us',
  },

  eu: {
    'nav.about': 'Konplexua',
    'nav.services': 'Zerbitzuak',
    'nav.availability': 'Eskuragarri',
    'nav.activities': 'Jarduerak',
    'nav.products': 'Produktuak',
    'nav.gallery': 'Argazkiak',
    'nav.contact': 'Kontaktua',
    'nav.book': 'Erreserbatu',

    'hero.badge': 'Igorre, Euskadi',
    'hero.title': '<em>UXARBEITI Baserria</em>',
    'hero.subtitle': 'Urkiola eta Gorbeia parke naturalen arteko familia-konplexu rurala.<br>Domo Gorbeia eta Urkiola Etxea naturaren erdian.',
    'hero.cta1': 'Orain erreserbatu',
    'hero.cta2': 'Konplexua ezagutu',
    'hero.pricefrom': 'tik',
    'hero.pricenight': '/gau',

    'about.title': 'Mendien arteko konplexu rurala',
    'about.p1': '<strong>UXARBEITI Baserria</strong> Euskal Herriko bihotzean dagoen familia-konplexu rurala da, <strong>Urkiola</strong> eta <strong>Gorbeia</strong> parke natural ikusgarrien artean.',
    'about.p2': 'Konplexuak bi egonaldi osagarri ditu: <strong>Urkiola Etxea</strong> eta <strong>Domo Gorbeia</strong>, erosotasuna, paisaia eta benetako landa-esperientzia eskaintzeko.',
    'about.feat1': 'Bi ostatu konplexu berean',
    'about.feat2': 'Domo Gorbeia + Urkiola Etxea',
    'about.feat3': 'Urkiola eta Gorbeia artean',
    'about.feat4': 'Landa turismoa eta tokiko produktua',
    'about.pricenote': 'Konplexuko egonaldiak eta esperientziak zuzenean erreserbatu',
    'about.bookdirect': 'Erreserba eskatu →',

    'uxa.title': 'UXARBEITI Baserriaren historia',
    'uxa.subtitle': 'Bizkaian hamarkadetako ibilbidea duen familia-proiektu agricola eta rurala',
    'uxa.p1': 'Uxarbeiti Baserria Urtza Sarrionandia eta bere gurasoek osatutako familia-ustiategia da: Edurtzeta Atutxa eta Iñaki Sarrionandia.',
    'uxa.p2': '80ko hamarkadan sortu zen, eta 2008an eta 2013an handitu zen; jarduera bi baserritan banatzen da: Uxarbeiti eta Iauribarrigoikoan Behekoa.',
    'uxa.p3': 'Gaur egun landa-ostatua eta nekazaritza uztartzen ditu: frutak, sasoiko barazkiak, kontserba artisauak eta tokiko salmenta.',
    'uxa.timeline.title': 'Mugarriak',
    'uxa.timeline.1': '80ko hamarkada: familia-ustiategiaren sorrera',
    'uxa.timeline.2': '2008: lehen handitzea',
    'uxa.timeline.3': '2013: handitze nagusia eta sendotzea',
    'uxa.stats.title': 'Datu nagusiak',
    'uxa.stats.1': '5000 m2 baratze zabaleko ekoizpena',
    'uxa.stats.2': '1 ha sagasti',
    'uxa.stats.3': '1,8 ha kiwi sail',
    'uxa.stats.4': '250 oilo',
    'uxa.recognition': 'Bizkaian eta Gipuzkoan aitortutako ustiategia, BBK azoketan presentziarekin eta Arratia zein Amorebietako tokiko salmentarekin.',

    'services.title': 'Zerbitzuak',
    'services.subtitle': 'Egonaldi erosoa eta lasaia izateko behar duzun guztia',
    'svc.kitchen.title': 'Sukalde ekipatua',
    'svc.kitchen.desc': 'Sukalde osoa labea, mikrouhin labea, ontzigarbia, hozkailua eta kafetegiarekin',
    'svc.wifi.title': 'Doako WiFi-a',
    'svc.wifi.desc': 'Abiadura handiko WiFi konexioa etxe osoan',
    'svc.parking.title': 'Aparkaleku pribatua',
    'svc.parking.desc': 'Doako aparkalekua jabetzan',
    'svc.bbq.title': 'Barbakoa',
    'svc.bbq.desc': 'Barbakoa gunea lorategian mahai eta aulkiekin',
    'svc.pets.title': 'Maskotak ongi etorriak',
    'svc.pets.desc': 'Lorategi itxia zure maskotek gozatzeko',
    'svc.family.title': 'Familiartzat',
    'svc.family.desc': 'Seaska eskuragarri, ohe arropa eta eskuoihalak barne',

    'avail.title': 'Eskuragarritasuna',
    'avail.subtitle': 'Kontsultatu eskuragarritasuna eta zure egonaldia erreserbatu',
    'avail.available': 'Eskuragarri',
    'avail.booked': 'Erreserbatua',
    'avail.syncnote': '📅 Eskuragarritasuna Booking.com eta Airbnb-tik eguneratuta',
    'price.title': 'Gaueko prezioak',
    'price.low': 'Sasoi baxua',
    'price.low.dates': 'Urtarrila - Martxoa, Azaroa',
    'price.mid': 'Tarteko sasoia',
    'price.mid.dates': 'Apirila - Ekaina, Iraila - Urria',
    'price.high': 'Goi sasoia',
    'price.high.dates': 'Uztaila - Abuztua, Zubi eta Jaiak',
    'price.night': '/gau',
    'price.bookdirect': '✉️ Orain erreserbatu',
    'price.bookbooking': 'Booking.com',
    'price.bookairbnb': 'Airbnb',

    'booking.title': 'Zuzeneko Erreserba Eskaera',
    'booking.subtitle': 'Bidali zure eskaera eta laster baieztatuko dizkizugu eskuragarritasuna eta prezioa.',
    'booking.name': 'Izen-abizenak',
    'booking.email': 'Emaila',
    'booking.phone': 'Telefonoa (WhatsApp)',
    'booking.guests': 'Gonbidatuak (Max 4)',
    'booking.checkin': 'Sarrera data',
    'booking.checkout': 'Irteera data',
    'booking.message': 'Mezua / Eskaerak / Maskotak',
    'booking.submit': 'Aurrekontua Eskatu Konpromisorik Gabe',
    'booking.note': '24 ordutan jarriko gara zurekin harremanetan eskuragarritasuna eta prezio zehatza baieztatzeko.',
    'booking.success': '✅ Zure posta-programa ireki da datu guztiekin. Bidali emaila eskaeraz arduratzeko.',
    'booking.error': 'Ezin izan da posta-programa ireki. Jarri gurekin harremanetan WhatsApp bidez.',

    'cal.mon': 'Al', 'cal.tue': 'As', 'cal.wed': 'Az',
    'cal.thu': 'Og', 'cal.fri': 'Or', 'cal.sat': 'Lr', 'cal.sun': 'Ig',

    'month.0': 'Urtarrila', 'month.1': 'Otsaila', 'month.2': 'Martxoa',
    'month.3': 'Apirila', 'month.4': 'Maiatza', 'month.5': 'Ekaina',
    'month.6': 'Uztaila', 'month.7': 'Abuztua', 'month.8': 'Iraila',
    'month.9': 'Urria', 'month.10': 'Azaroa', 'month.11': 'Abendua',

    'act.title': 'Jarduerak eta inguruak',
    'act.subtitle': 'Ezagutu UXARBEITI Baserriaren inguruan egin eta ikus dezakezun guztia',
    'act.urkiola.title': 'Urkiolako Parke Naturala',
    'act.urkiola.desc': 'Mendizaletasun ibilbide ikusgarriak, santutegia eta Anbotoko bista harrigarriak',
    'act.urkiola.dist': '📍 15 min autoz',
    'act.gorbeia.title': 'Gorbeiako Parke Naturala',
    'act.gorbeia.desc': 'Bizkaiko sabaia pago basoekin, ur-jauziekin eta Gorbeiako gurutze ikonikoarekin',
    'act.gorbeia.dist': '📍 20 min autoz',
    'act.bilbao.title': 'Bilbo eta Guggenheim',
    'act.bilbao.desc': 'Bizkaiako hiriburua Guggenheim museoarekin, pintxoekin eta Alde Zaharrarekin',
    'act.bilbao.dist': '📍 30 min autoz',
    'act.gastro.title': 'Euskal gastronomia',
    'act.gastro.desc': 'Sagardotegiak, erretegileak eta munduko gastronomia onena minutu gutxira',
    'act.gastro.dist': '📍 Inguruan',
    'act.beach.title': 'Bizkaiko hondartzak',
    'act.beach.desc': 'Bakio, Bermeo, Lagako hondartzak eta Urdaibai erreserba ikusgarria',
    'act.beach.dist': '📍 40 min autoz',
    'act.cycling.title': 'Txirrindularitza eta BTT',
    'act.cycling.desc': 'Errepide eta mendi txirrindularitza ibilbideak paisaia berde ikusgarrien artean',
    'act.cycling.dist': '📍 Atetik bertatik',

    'products.title': 'Baserriko produktuak',
    'products.subtitle': 'Uxarbeiti Baserriaren ekoizpen propioa eta artisau elaborazioak',
    'products.shop.title': 'BBK Azoka denda',
    'products.shop.desc': 'Sartu Uxarbeiti Baserri bildumara, eskuragarri dauden produktuak ikusi eta online erosteko.',
    'products.shop.cta': 'Katalogoa ikusi →',
    'products.fruit.title': 'Fruta eta baratzea',
    'products.fruit.desc': 'Ustiategian hazitako kiwiak, sagarrak, pikuak, irasagarrak eta sasoiko barazkiak.',
    'products.preserves.title': 'Kontserba artisauak',
    'products.preserves.desc': 'Marmeladak, piperminak, kremak eta zukuak, produktu propioekin eginak.',
    'products.local.title': 'Tokiko salmenta',
    'products.local.desc': 'BBK azoketan eta Amorebieta zein Arratia haraneko salmenta-puntuetan banatuta.',

    'gallery.title': 'Argazkiak',
    'gallery.subtitle': 'Begiratu etxea eta bere inguruak',

    'reviews.title': 'Iritziak',
    'reviews.subtitle': 'Gure gonbidatuek esaten dutena',
    'reviews.cta': 'Google-n iritzi guztiak ikusi',
    'reviews.verified': '✓ Egonaldi egiaztatua',

    'contact.title': 'Kontaktua',
    'contact.subtitle': 'Galderarik baduzu? Ez izan zalantzarik gurekin harremanetan jartzeko',
    'contact.how': 'Nola iritsi',
    'contact.how.desc': 'Igorre-n gaude, Bizkaiko bihotzean, Bilbotik 30 minutura eta bi parke naturalen artean.',
    'contact.location': 'Kokalekua',
    'contact.checkin': 'Sarrera / Irteera',
    'contact.checkin.val': 'Sarrera: 16:00 · Irteera: 11:00',
    'contact.reservas': 'Erreserbak',
    'contact.directions': 'Nola iritsi',
    'contact.directions.link': 'Google Maps-en ikusi →',

    'footer.desc': 'Urkiola eta Gorbeia parke naturalen arteko familia-konplexu rurala, ostatuarekin eta tokiko produktuarekin.',
    'footer.sections': 'Atalak',
    'footer.book': 'Erreserbatu',
    'footer.rights': '© 2026 UXARBEITI Baserria. Eskubide guztiak erreserbatuta.',
    'footer.house': 'Konplexua',
    'footer.services': 'Zerbitzuak',
    'footer.availability': 'Eskuragarritasuna',
    'footer.activities': 'Jarduerak',
    'footer.products': 'Produktuak',
    'footer.gallery': 'Argazkiak',
    'footer.contact': 'Kontaktua',
    'footer.direct': 'Zuzeneko erreserba',
    'whatsapp.tooltip': 'Galderak? Idatzi iezaguzu',
  }
};

// Current language
let currentLang = sessionStorage.getItem('mendien-lang') || 'es';

/**
 * Get translation for a key
 */
function t(key) {
  return translations[currentLang]?.[key] || translations['es'][key] || key;
}

/**
 * Limit translated HTML to a tiny safe subset.
 */
function sanitizeTranslationMarkup(value) {
  const template = document.createElement('template');
  template.innerHTML = value;

  const allowedTags = new Set(['BR', 'STRONG', 'EM']);

  const sanitizeNode = (node) => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowedTags.has(child.tagName)) {
          child.replaceWith(document.createTextNode(child.textContent || ''));
          return;
        }

        Array.from(child.attributes).forEach(attr => child.removeAttribute(attr.name));
        sanitizeNode(child);
        return;
      }

      if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    });
  };

  sanitizeNode(template.content);
  return template.content;
}

/**
 * Apply translations to all elements with data-i18n attribute
 */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);
    if (value) {
      // Check if the content contains HTML
      if (value.includes('<')) {
        el.replaceChildren(sanitizeTranslationMarkup(value));
      } else {
        el.textContent = value;
      }
    }
  });

  // Update html lang attribute
  document.documentElement.lang = currentLang === 'eu' ? 'eu' : currentLang === 'en' ? 'en' : 'es';

  // Update active state of language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });

  // Re-render calendar with new language
  if (typeof renderCalendar === 'function') {
    renderCalendar();
  }
}

/**
 * Set language and apply
 */
function setLanguage(lang) {
  currentLang = lang;
  sessionStorage.setItem('mendien-lang', lang);
  applyTranslations();
}

/**
 * Initialize language switcher
 */
function initLanguageSwitcher() {
  const switchers = document.querySelectorAll('.lang-switcher');
  if (switchers.length === 0) return;

  switchers.forEach(switcher => {
    switcher.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
      });
    });
  });

  // Apply initial translations
  applyTranslations();
}
