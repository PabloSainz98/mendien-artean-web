'use strict';
const { config, issues, version, published, publishedVersion } = require('../shared/legal');
const copy = {
  es: {
    notice: 'Aviso legal',
    terms: 'Condiciones de estancia',
    cookies: 'Cookies',
    privacy: 'Privacidad',
    intro:
      'Queremos que sepas quiénes somos, cómo cuidamos tus datos y cómo gestionamos tu estancia.',
    draft:
      'Borrador pendiente de revisión del titular. No publicar hasta completar los datos y las condiciones.',
    pending: 'Pendiente de confirmar por el titular antes de publicar.',
    identity: 'Quiénes somos',
    holder: 'Titular',
    tax: 'NIF',
    address: 'Domicilio profesional',
    registry: 'Registro mercantil (si procede)',
    tourism: 'Registro y categoría turística',
    contact:
      'Puedes escribirnos para consultas, reclamaciones o el ejercicio de tus derechos. Nuestro canal de privacidad es',
    links: 'Enlaces y contenidos',
    linksText:
      'Compartimos fotografías e información de nuestro complejo. Los enlaces a Booking, Airbnb, BBK Azoka y otros sitios te llevan a servicios externos con sus propias condiciones. No vendemos productos ni cobramos reservas a través de esta web. No limitamos los derechos que te reconoce la normativa de consumo.',
    purpose: 'Para qué usamos tus datos y con qué base',
    purposeText:
      'Usamos los datos que nos facilitas para responder a tu petición, preparar y gestionar tu estancia: medidas precontractuales o ejecución del contrato (art. 6.1.b RGPD). Tratamos los datos exigidos por obligaciones legales con base en el art. 6.1.c. Protegemos el servicio y prevenimos abusos con base en nuestro interés legítimo (art. 6.1.f), sujeto a ponderación. No utilizamos tus datos para publicidad, perfiles comerciales ni decisiones de reserva exclusivamente automatizadas.',
    data: 'Qué información necesitamos',
    dataText:
      'Pedimos nombre, correo, teléfono, alojamiento, fechas y número de adultos, niños y mascotas. El mensaje es opcional. Registramos también el estado de la solicitud, la versión del aviso mostrado y, si procede, importes y movimientos de pago introducidos por nuestro equipo. Los campos obligatorios permiten atender la solicitud; si no los facilitas, puedes consultarnos por teléfono. No envíes documentos de identidad, datos de salud, tarjetas ni IBAN. El registro obligatorio de viajeros se realiza por un procedimiento separado.',
    retention: 'Cuánto tiempo conservamos los datos',
    providers: 'Proveedores y destinatarios',
    providerText:
      'Usamos alwaysdata para alojar la web, la base de datos y el correo. Los avisos de gestión se remiten actualmente a una cuenta de Gmail; también puede haber reenvío del buzón del alojamiento. Si eliges WhatsApp, te dirigimos a ese servicio y tú decides enviar el mensaje. Estos canales implican proveedores externos; no afirmamos que todos los datos permanezcan exclusivamente en nuestro servidor o en la UE. No comunicamos información a otros destinatarios salvo necesidad del servicio u obligación legal.',
    rights: 'Tus derechos',
    rightsText:
      'Puedes solicitar acceso, rectificación, supresión, limitación, oposición y, cuando corresponda, portabilidad. Si un tratamiento se basara en consentimiento, podrías retirarlo sin afectar a su uso previo. Atenderemos tu solicitud, en general, en un mes; las ampliaciones legalmente permitidas se comunicarán. Comprobaremos tu identidad de forma proporcionada, sin pedir automáticamente una copia del DNI. Puedes presentar una reclamación ante la Agencia Española de Protección de Datos en www.aepd.es. La supresión puede estar limitada por obligaciones de conservación o defensa de reclamaciones.',
    security: 'Seguridad y comunicaciones',
    securityText:
      'Restringimos el panel a nuestro equipo, usamos HTTPS y mantenemos copias privadas. Los registros técnicos del hosting pueden contener IP y datos de acceso para seguridad y operación. No existe seguridad absoluta. No solicitamos datos de menores para consultas, salvo el número necesario para calcular la capacidad y el precio. Si recibimos una petición por teléfono o WhatsApp, facilitaremos esta información al registrar la estancia.',
    request: 'Cómo solicitar y confirmar una estancia',
    requestText:
      'Elige alojamiento, fechas y grupo; revisa y corrige los campos y el desglose antes de enviar. Guardamos la solicitud y mostramos su referencia: no es una confirmación ni un cobro. Revisamos disponibilidad y acordamos contigo las condiciones antes de confirmar. Podemos atenderte en español, inglés y euskera. Conservamos la solicitud en nuestro panel privado; puedes pedirnos una copia. La confirmación y cualquier modificación acordada deben quedar por escrito en un soporte que puedas conservar.',
    prices: 'Precios y suplementos',
    pricesText:
      'Calculamos cada noche según su temporada: alta del 1 de junio al 30 de septiembre y del 20 de diciembre al 6 de enero, ambos incluidos; baja el resto. Un adulto: casa 57/75 € y domo 157/175 € en baja/alta. Añadimos 10 € por adulto adicional, 5 € por niño y 10 € por mascota, por noche; limpieza 40 € una vez por estancia. La salida no se cobra como noche. La capacidad total incluye niños: casa 4 y domo 3. Consulta la disponibilidad de cuna y las condiciones infantiles antes de confirmar.',
    taxes: 'Los precios publicados incluyen los impuestos aplicables.',
    payment: 'Señal y forma de pago',
    cancellation: 'Cambios, cancelaciones y no presentación',
    rules: 'Horarios y normas de la estancia',
    withdrawal: 'Desistimiento y reclamaciones',
    withdrawalText:
      'En los servicios de alojamiento turístico contratados para fechas concretas no se aplica el desistimiento general de 14 días (art. 103.l del RDL 1/2007). Esto no elimina tus derechos ni equivale a que toda cancelación sea no reembolsable: se aplican las condiciones acordadas y la normativa correspondiente. Contacta con nosotros para reclamar; también puedes acudir a Kontsumobide. No declaramos adhesión al arbitraje de consumo sin haberla confirmado.',
    cookiesText:
      'No instalamos cookies publicitarias ni de analítica. El panel privado utiliza una cookie propia de sesión (uxarbeiti_admin en desarrollo; __Host-uxarbeiti_admin en producción), de hasta 8 horas, para autenticar al equipo. Es técnica y no necesita consentimiento para funcionar. Las preferencias y borradores públicos no se guardan en localStorage ni sessionStorage. No cargamos mapas, chats ni calendarios de terceros embebidos. Al abrir un enlace externo se aplican las condiciones de ese proveedor. Si incorporamos tecnologías no exentas, pediremos consentimiento antes de activarlas.',
    layer:
      'Usamos tus datos para atender esta solicitud y gestionar tu estancia, por medidas precontractuales o contrato; no para publicidad. Puedes ejercer tus derechos en',
    read: 'He leído la información de privacidad. Entiendo que enviar la solicitud no confirma la estancia.',
  },
  en: {
    notice: 'Legal notice',
    terms: 'Stay conditions',
    cookies: 'Cookies',
    privacy: 'Privacy',
    intro:
      'We want you to know who we are, how we look after your data and how we manage your stay.',
    draft:
      'Draft awaiting the operator’s review. Do not publish until the details and conditions are complete.',
    pending: 'Awaiting confirmation by the operator before publication.',
    identity: 'Who we are',
    holder: 'Operator',
    tax: 'Tax ID',
    address: 'Business address',
    registry: 'Commercial registration (where applicable)',
    tourism: 'Tourism registration and category',
    contact: 'Contact us with questions, complaints or privacy requests. Our privacy email is',
    links: 'Links and content',
    linksText:
      'We share photographs and information about our rural retreat. Links to Booking, Airbnb, BBK Azoka and other websites lead to external services with their own terms. We do not sell products or take booking payments on this website. Your statutory consumer rights are not restricted.',
    purpose: 'Why we use your data and our legal basis',
    purposeText:
      'We use your details to respond to your request and arrange and manage your stay: steps before entering a contract or performing it (GDPR art. 6.1.b). Legal obligations rely on art. 6.1.c. Service security and abuse prevention rely on legitimate interests (art. 6.1.f), subject to a balancing assessment. We do not use your information for advertising, commercial profiling or exclusively automated booking decisions.',
    data: 'Information we need',
    dataText:
      'We request your name, email, phone, accommodation, dates and numbers of adults, children and pets. Your message is optional. We also record request status, the version of the notice shown and, where relevant, payment amounts and transactions entered by our team. Required fields help us handle your request; you can also call us. Do not send identity documents, health details, card numbers or bank account numbers. Mandatory traveller registration is handled separately.',
    retention: 'How long we keep your data',
    providers: 'Providers and recipients',
    providerText:
      'We use alwaysdata for website hosting, the database and email. Management notifications currently go to a Gmail account; the accommodation mailbox may also forward messages. If you choose WhatsApp, we open that service and you decide whether to send the message. These channels involve external providers; we do not claim that all data stays exclusively on our server or within the EU. Other disclosures require a service need or legal obligation.',
    rights: 'Your rights',
    rightsText:
      'You may request access, correction, erasure, restriction, objection and, where applicable, portability. Where processing relies on consent, you may withdraw it without affecting earlier lawful processing. We normally respond within one month and will explain any legally permitted extension. We verify identity proportionately, without routinely requesting a copy of your ID. You can complain to the Spanish Data Protection Agency at www.aepd.es. Legal retention duties or claims may limit erasure.',
    security: 'Security and communications',
    securityText:
      'We restrict management access to our team, use HTTPS and maintain private backups. Hosting logs may include IP addresses and access details for security and operation. Absolute security cannot be guaranteed. At the enquiry stage we only request the number of children needed to calculate capacity and price, not their personal details. We provide this privacy information when recording stays arranged by phone or WhatsApp.',
    request: 'Requesting and confirming a stay',
    requestText:
      'Choose accommodation, dates and guests, then review and correct your details and price breakdown before sending. We save your request and display a reference; this is not confirmation or payment. We check availability and agree the conditions with you before confirming. We can assist in Spanish, English and Basque. We keep your request in our private panel and you can ask for a copy. Confirmations and agreed amendments should be provided in writing in a form you can retain.',
    prices: 'Prices and supplements',
    pricesText:
      'Each night is priced by season: high from 1 June to 30 September and 20 December to 6 January inclusive; low otherwise. One adult: house €57/75 and dome €157/175 for low/high season. Per night we add €10 per extra adult, €5 per child and €10 per pet. Final cleaning is €40 once per stay. The checkout date is not charged as a night. Capacity includes children: house 4, dome 3. Ask about cot availability and children’s conditions before confirming.',
    taxes: 'Published prices include applicable taxes.',
    payment: 'Deposit and payment',
    cancellation: 'Changes, cancellations and no-shows',
    rules: 'Arrival times and house rules',
    withdrawal: 'Withdrawal and complaints',
    withdrawalText:
      'Tourist accommodation booked for specific dates is excluded from the general 14-day withdrawal right (art. 103.l of Spanish RDL 1/2007). This does not remove your other rights or make every cancellation non-refundable: agreed conditions and applicable law still apply. Contact us with complaints; you may also contact Kontsumobide. We do not claim membership of a consumer arbitration scheme without verification.',
    cookiesText:
      'We do not install advertising or analytics cookies. Our private management panel uses a first-party session cookie (uxarbeiti_admin in development; __Host-uxarbeiti_admin in production), lasting up to 8 hours, to authenticate staff. It is strictly necessary and does not need consent. Public preferences and drafts are not saved in localStorage or sessionStorage. We do not embed third-party maps, chats or calendars. External links are subject to their provider’s terms. If we add non-exempt technologies, we will request consent before activating them.',
    layer:
      'We use your information to handle this request and manage your stay, under pre-contractual steps or a contract, not for advertising. Exercise your rights at',
    read: 'I have read the privacy information. I understand that submitting a request does not confirm a stay.',
  },
  eu: {
    notice: 'Lege-oharra',
    terms: 'Egonaldiaren baldintzak',
    cookies: 'Cookieak',
    privacy: 'Pribatutasuna',
    intro:
      'Nor garen, zure datuak nola zaintzen ditugun eta zure egonaldia nola kudeatzen dugun azaldu nahi dizugu.',
    draft: 'Titularrak berrikusteko zirriborroa. Ez argitaratu datuak eta baldintzak osatu arte.',
    pending: 'Titularrak baieztatu behar du argitaratu aurretik.',
    identity: 'Nor gara',
    holder: 'Titularra',
    tax: 'IFZ',
    address: 'Helbide profesionala',
    registry: 'Merkataritza-erregistroa (hala badagokio)',
    tourism: 'Turismo-erregistroa eta kategoria',
    contact:
      'Idatzi guri galderak, erreklamazioak edo datuei buruzko eskubide-eskaerak egiteko. Pribatutasunerako helbidea:',
    links: 'Estekak eta edukiak',
    linksText:
      'Gure ostatuen argazkiak eta informazioa partekatzen ditugu. Booking, Airbnb, BBK Azoka eta beste webgune batzuetarako estekek kanpoko zerbitzuetara eramaten zaituzte; bakoitzak bere baldintzak ditu. Webgune honetan ez dugu produkturik saltzen edo erreserbarik kobratzen. Ez ditugu kontsumitzaile gisa dituzun legezko eskubideak mugatzen.',
    purpose: 'Zertarako erabiltzen ditugu datuak eta zer oinarrirekin',
    purposeText:
      'Zure eskaerari erantzuteko eta egonaldia prestatu eta kudeatzeko erabiltzen ditugu datuak: kontratua egin aurreko neurriak edo kontratua betetzea (DBEOren 6.1.b artikulua). Legezko betebeharrak betetzeko 6.1.c artikulua erabiltzen dugu. Zerbitzua babesteko eta gehiegikeriak saihesteko gure interes legitimoa erabiltzen dugu (6.1.f artikulua), interesak haztatuta. Ez ditugu datuak publizitaterako, merkataritza-profilak egiteko edo erabaki guztiz automatizatuak hartzeko erabiltzen.',
    data: 'Zer informazio behar dugu',
    dataText:
      'Izena, posta elektronikoa, telefonoa, ostatua, datak eta heldu, haur eta maskoten kopurua eskatzen ditugu. Mezua aukerakoa da. Eskaeraren egoera, erakutsitako oharraren bertsioa eta, hala badagokio, gure taldeak sartutako ordainketa-mugimenduak ere gordetzen ditugu. Derrigorrezko datuak eskaera kudeatzeko dira; telefonoz ere hitz egin dezakegu. Ez bidali nortasun-agiririk, osasun-daturik, txartel-zenbakirik edo IBANik. Bidaiarien nahitaezko erregistroa beste prozedura baten bidez egiten dugu.',
    retention: 'Zenbat denboraz gordetzen ditugu datuak',
    providers: 'Hornitzaileak eta hartzaileak',
    providerText:
      'alwaysdata erabiltzen dugu webgunea, datu-basea eta posta ostatatzeko. Kudeaketa-abisuak Gmail kontu batera bidaltzen ditugu gaur egun; ostatuaren postontziak mezuak birbidal ditzake. WhatsApp aukeratzen baduzu, zerbitzu hori irekitzen dugu eta zuk erabakitzen duzu mezua bidali ala ez. Kanal horietan kanpoko hornitzaileek parte hartzen dute; ez dugu esaten datu guztiak gure zerbitzarian edo EBn bakarrik geratzen direnik. Bestelako komunikazioek zerbitzuaren beharra edo legezko betebeharra izan behar dute oinarri.',
    rights: 'Zure eskubideak',
    rightsText:
      'Datuak eskuratzeko, zuzentzeko, ezabatzeko, tratamendua mugatzeko, aurka egiteko eta, dagokionean, eramangarritasuna eskatzeko eskubidea duzu. Tratamenduren bat baimenean oinarritzen bada, baimena kendu ahal izango duzu, aurreko erabilera zilegiari eragin gabe. Oro har, hilabeteko epean erantzungo dugu; legezko luzapenik behar izanez gero, jakinaraziko dizugu. Nortasuna neurriz egiaztatuko dugu, NANaren kopia automatikoki eskatu gabe. Erreklamazioa aurkez dezakezu Datuak Babesteko Espainiako Agentzian: www.aepd.es. Legezko gordetze-betebeharrek edo erreklamazioek ezabatzea mugatu dezakete.',
    security: 'Segurtasuna eta komunikazioak',
    securityText:
      'Kudeaketa-panelerako sarbidea gure taldera mugatzen dugu, HTTPS erabiltzen dugu eta kopia pribatuak gordetzen ditugu. Ostatu-zerbitzuaren erregistro teknikoek IP helbideak eta sarbide-datuak jaso ditzakete. Ez dago erabateko segurtasunik. Kontsultak egiteko ez dugu haurren datu pertsonalik eskatzen, edukiera eta prezioa kalkulatzeko kopurua baizik. Telefonoz edo WhatsApp bidez adostutako egonaldiak erregistratzean ere informazio hau emango dugu.',
    request: 'Nola eskatu eta baieztatu egonaldia',
    requestText:
      'Aukeratu ostatua, datak eta taldea; berrikusi eta zuzendu datuak eta prezioaren banakapena bidali aurretik. Eskaera gordetzen dugu eta erreferentzia erakusten dizugu: ez da baieztapena, ezta ordainketa ere. Datak libre dauden egiaztatu eta baldintzak zurekin adosten ditugu baieztatu aurretik. Euskaraz, gaztelaniaz eta ingelesez lagun diezazukegu. Eskaera panel pribatuan gordetzen dugu; kopia eska diezagukezu. Baieztapena eta adostutako aldaketak gorde dezakezun euskarri batean idatziz eman behar dira.',
    prices: 'Prezioak eta gehigarriak',
    pricesText:
      'Gau bakoitzaren denboraldiaren arabera kalkulatzen dugu prezioa: goi-denboraldia ekainaren 1etik irailaren 30era eta abenduaren 20tik urtarrilaren 6ra, biak barne; behe-denboraldia gainerako egunetan. Heldu batentzat: etxea 57/75 € eta domoa 157/175 €, behe/goi-denboraldian. Gau bakoitzeko: 10 € heldu gehigarri bakoitzeko, 5 € haur bakoitzeko eta 10 € maskota bakoitzeko. Azken garbiketa 40 € da, behin egonaldiko. Irteera ez dugu gau gisa kobratzen. Edukierak haurrak barne hartzen ditu: etxean 4, domoan 3. Galdetu sehaskari eta haurren baldintzei buruz baieztatu aurretik.',
    taxes: 'Argitaratutako prezioek aplikatu beharreko zergak barne hartzen dituzte.',
    payment: 'Aurrerakina eta ordainketa',
    cancellation: 'Aldaketak, ezeztapenak eta ez agertzea',
    rules: 'Ordutegiak eta etxeko arauak',
    withdrawal: 'Atzera egitea eta erreklamazioak',
    withdrawalText:
      'Data zehatzetarako kontratatutako turismo-ostatuetan ez da aplikatzen 14 eguneko atzera egiteko eskubide orokorra (1/2007 Legegintzako Errege Dekretuaren 103.l artikulua). Horrek ez ditu beste eskubideak ezabatzen eta ez du esan nahi ezeztapen guztiek dirua galtzea dakartenik: adostutako baldintzak eta dagokion araudia aplikatzen dira. Jarri gurekin harremanetan erreklamazioetarako; Kontsumobidera ere jo dezakezu. Ez dugu kontsumo-arbitrajeari atxikita gaudenik adierazten, egiaztatu gabe.',
    cookiesText:
      'Ez dugu publizitate- edo analitika-cookierik instalatzen. Kudeaketa-panel pribatuak gure saioko cookie bat erabiltzen du (uxarbeiti_admin garapenean; __Host-uxarbeiti_admin produkzioan), gehienez 8 orduz, taldea autentifikatzeko. Beharrezkoa den cookie teknikoa da, eta ez du baimenik behar. Ez ditugu lehentasun edo zirriborro publikoak localStorage edo sessionStorage bidez gordetzen. Ez dugu kanpoko maparik, txatik edo egutegirik txertatzen. Kanpoko esteka bat irekitzean hornitzaile horren baldintzak aplikatzen dira. Baimena behar duten teknologiak gehitzen baditugu, aktibatu aurretik eskatuko dugu.',
    layer:
      'Zure datuak eskaera eta egonaldia kudeatzeko erabiltzen ditugu, kontratua egin aurreko neurrien edo kontratuaren bidez; ez publizitaterako. Zure eskubideak baliatzeko helbidea:',
    read: 'Pribatutasun-informazioa irakurri dut. Badakit eskaera bidaltzeak ez duela egonaldia baieztatzen.',
  },
};
function legalContent(lang, mode = 'draft') {
  const t = copy[lang];
  if (mode === 'published') {
    const previous = published[lang];
    return {
      ...t,
      ready: false,
      preserved: true,
      intro: previous.intro,
      read: previous.consent,
      version: publishedVersion,
      pages: { privacidad: { title: previous.title, sections: previous.sections } },
    };
  }
  if (mode !== 'draft') throw new Error('Invalid legal publication mode');
  const value = (key) => config.policies[key][lang] || t.pending;
  const identity = [
    [t.holder, config.holder || t.pending],
    [t.tax, config.taxId || t.pending],
    [t.address, config.address || t.pending],
    [t.registry, config.commercialRegistry || t.pending],
    [
      t.tourism,
      `Urkiola Etxea: ${config.registrations.casa || t.pending} / ${config.categories.casa || t.pending}. Domo Gorbeia: ${config.registrations.domo || t.pending} / ${config.categories.domo || t.pending}.`,
    ],
  ];
  return {
    ...t,
    ready: issues().length === 0,
    version,
    pages: {
      'aviso-legal': {
        title: t.notice,
        sections: [...identity, [t.contact, config.privacyEmail], [t.links, t.linksText]],
      },
      privacidad: {
        title: t.privacy,
        sections: [
          [t.identity, config.holder || t.pending],
          [t.contact, config.privacyEmail],
          [t.purpose, t.purposeText],
          [t.data, t.dataText],
          [t.retention, value('retention')],
          [t.providers, `${t.providerText} ${value('providers')}`],
          [t.rights, t.rightsText],
          [t.security, t.securityText],
        ],
      },
      condiciones: {
        title: t.terms,
        sections: [
          [t.request, t.requestText],
          [t.prices, `${t.pricesText} ${config.pricesIncludeTaxes === true ? t.taxes : t.pending}`],
          [t.payment, value('payment')],
          [t.cancellation, value('cancellation')],
          [t.rules, value('houseRules')],
          [t.withdrawal, t.withdrawalText],
        ],
      },
      cookies: { title: t.cookies, sections: [[t.cookies, t.cookiesText]] },
    },
  };
}
module.exports = { legalContent };
