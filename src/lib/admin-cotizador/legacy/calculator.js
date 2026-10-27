
// ===== COSTOS BASE =====
var C={
  pvc:11.50,pp:7.00,lunchera:25.00,empaqueD:0,
  lp:120,lm:45,lcm:50,
  opal:2.50,foto:3.20,vb:6.00,vt:11.50,
  tattoo:24.00,disFee:80,
  atom100:11.00,esponja:3.00,
  atom30:18.00,celofan:3.00,
  holoLiso:12.25,holoTex:11.00,glow:15.00,mag:15.00,
  lamLiso:9.00,lamTex:10.00,stkDisFee:80,
  inf:50,adu:60,tote:55,tallaEsp:30,
  lienzo:350,lienzoArea:9000,empaqueP:3,
  gorraC:28,gorraK:35,parcheEco:15,parchePremium:50,
  // Imanes
  rolloMagPrice:1348,rolloMagW:61,rolloMagL:1500,
  vcorteHoloAPrice:240,vcorteHoloAW:30,vcorteHoloAL:120,
  vcorteHoloBPrice:225,vcorteHoloBW:30,vcorteHoloBL:1000,
  vcorteCustomPrice:200,vcorteCustomW:30,vcorteCustomL:100,
  resinaPerPieza:15,
  // Accesorios - llaveros y tags
  llavero:55,tagRect:11.35,tagRedondo:9.45,accCorteCosto:5,
  // Accesorios - vasos
  vasoMason16Color:88.75,vasoMason16Trans:82.60,vasoInfantil10:86.07,
  tumbler24Trans:99.01,vidrio16Asa:125.34,tumbler24Color:95.47,vasoLata:53.33,
  // Liquidos (interno)
  aguaDestL:27,glicerinaL:197,aceiteMineralL:96.90,
  colorComMl:1.30,glitter60g:180,mica810g:912.68,
  colorBaseAlcohol:0,colorBaseAceite:0,colorAcrilico:0,
  // DTF UV
  dtfUVPrice:450,dtfUVW:38,dtfUVL:100,
  // Láser (Falcon A1 10W) y 3D (Bambu Lab P1S)
  laserRate:5,laserSetup:80,
  filPla:420,filPlaSeda:520,filPetg:480,filAbs:540,filTpu:650,
  print3dRate:12,print3dMerma:12,print3dSetup:80
};

// ===== ESTADOS =====
var SD={mat:'pvc',liston:false,agra:false,agraSize:'6x6',sticker:false,stickerMat:'foto',stickerSize:5,qtyD:10,margenD:40};
var STS_S={size:4,pkg:30,customQty:30,diseno:true,margenTS:50};
var STK={size:4,bolsas:10,margenTK:55};
var STS={tipo:'adulto',qty:20,tallaEsp:false,area:603,margen:35,mdo:500,traslado:200,otros:0,mixtoInf:0,mixtoAdu:10};
var SCL={tipo:'curva',parcheTipo:'eco',qty:20,margen:40,mdo:500,traslado:200,otros:0,mixtoEco:7,mixtoPremium:3};
var SP={tipo:'adulto',qty:5,tallaEsp:false,area:603,margen:40};
var SST={type:'troquelado',mat:'vb',lam:'none',cut:'sin',w:5,h:5,qty:50,diseno:true,margenTro:50,qtyPlan:10,disenoPlan:true,margenPlan:50,planPPH:1,wUV:5,hUV:5,qtyUV:50,disenoUV:true,disFeeUV:80,margenUV:50};
var COT={cotNum:3,iva:false,lines:[]};
var REC={recNum:1,iva:false,lines:[],payMethod:'efectivo',attachment:null};
var SIMN={w:5,h:5,qty:10,margen:45,printType:'vinil_adhesivo',mat:'vb',lam:'none',corteType:'holoA',acabado:'none',diseno:true,disFee:80};
var SACC_TL={tipo:'llavero',qty:10,margen:50,dtfW:5,dtfH:8,doubleDTF:false,useFoto:false,fotoArea:10,useCorte:false,corteCosto:5,diseno:true,disFee:80};
var SACC_V={tipo:'mason16color',qty:10,margen:45,mlAgua:0,mlGlicerina:0,mlAceite:0,mlColor:0,gGlitter:0,gMica:0,mlBaseAlcohol:0,mlBaseAceite:0,mlAcrilico:0,dtfW:0,dtfH:0,diseno:true,disFee:80};
var SLAS={min:10,rate:5,useInsumo:false,insumoNombre:'Termo',insumoCosto:0,consumible:0,qty:10,setup:true,setupFee:80,margen:50};
var S3D={fil:'pla',gramos:50,horas:3,post:0,qty:5,setup:true,setupFee:80,margen:50};

// ===== MATERIALES STICKER =====
var MATS={
  foto:{label:'Papel fotográfico',size:'carta',w:21.6,h:27.9,cKey:'foto'},
  vb:{label:'Vinil blanco',size:'A4',w:21.0,h:29.7,cKey:'vb'},
  vt:{label:'Vinil transparente',size:'carta',w:21.6,h:27.9,cKey:'vt'},
  holoLiso:{label:'Vinil holográfico liso tornasol',size:'A4',w:21.0,h:29.7,cKey:'holoLiso'},
  holoTex:{label:'Vinil holográfico texturizado visual',size:'A4',w:21.0,h:29.7,cKey:'holoTex'},
  glow:{label:'Vinil glow-in-the-dark',size:'A4',w:21.0,h:29.7,cKey:'glow'},
  mag:{label:'Papel magnético',size:'A4',w:21.0,h:29.7,cKey:'mag',reqLam:true}
};

// ===== PRECIOS CALCULADOS =====
var PRICES={
  dulceros:{desc:'',qty:0,unitPrice:0},
  tattooStation:{desc:'',qty:0,unitPrice:0},
  tattooKit:{desc:'',qty:0,unitPrice:0},
  tshirt:{desc:'',qty:0,unitPrice:0},
  caplab:{desc:'',qty:0,unitPrice:0},
  prendas:{desc:'',qty:0,unitPrice:0},
  stickers:{desc:'',qty:0,unitPrice:0},
  imanes:{desc:'',qty:0,unitPrice:0},
  accTagLlavero:{desc:'',qty:0,unitPrice:0},
  accVasos:{desc:'',qty:0,unitPrice:0},
  laser:{desc:'',qty:0,unitPrice:0},
  print3d:{desc:'',qty:0,unitPrice:0}
};

// ===== HELPERS =====
function fmt(n){return'$'+n.toFixed(2);}
function fmtK(n){return'$'+(Math.round(n)).toLocaleString('es-MX');}
function resCard(label,val,sub,hi){return'<div class="res-card"><p class="res-label">'+label+'</p><p class="res-val'+(hi?' hi':'')+'">'+val+'</p>'+(sub?'<p class="res-sub">'+sub+'</p>':'')+'</div>';}
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ===== NAVEGACIÓN =====
function switchPage(p){
  document.querySelectorAll('.page').forEach(function(el){el.classList.remove('active')});
  document.querySelectorAll('.main-tab').forEach(function(b){b.classList.toggle('active',b.dataset.page===p)});
  document.getElementById('page-'+p).classList.add('active');
  if(p==='cotizacion')renderCotLines();
  if(p==='recibos'){renderRecLines();refreshSavedCotDropdown();}
}
function setTattooSub(sub,el){
  document.querySelectorAll('#page-tattoo .sub-tab').forEach(function(b){b.classList.remove('active-cyan','active-purple')});
  el.classList.add('active-cyan');
  document.getElementById('sub-tattoo-station').classList.toggle('active',sub==='station');
  document.getElementById('sub-tattoo-kit').classList.toggle('active',sub==='kit');
  if(sub==='kit'){el.classList.remove('active-cyan');el.classList.add('active-purple');}
}
function setStickerSub(sub,el){
  document.querySelectorAll('#page-stickers .sub-tab').forEach(function(b){b.classList.remove('active-purple','active-cyan')});
  el.classList.add(sub==='uv'?'active-cyan':'active-purple');
  SST.type=sub;
  document.getElementById('sub-stk-troquelado').classList.toggle('active',sub==='troquelado');
  document.getElementById('sub-stk-planilla').classList.toggle('active',sub==='planilla');
  document.getElementById('sub-stk-uv').classList.toggle('active',sub==='uv');
  // Ocultar tarjetas compartidas (material/laminado/corte) cuando es UV
  document.getElementById('stk-shared-cards').style.display=(sub==='uv')?'none':'';
  calcStk();
}
function changeUVQty(d){var el=document.getElementById('qty-uv');var v=Math.max(1,parseInt(el.value||'1')+d);el.value=v;calcStk();}

// ===== DULCEROS =====
function setMat(m,el){SD.mat=m;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcD();}
function toggleAgra(){SD.agra=document.getElementById('chk-agra').checked;document.getElementById('agra-opts').classList.toggle('hidden',!SD.agra);calcD();}
function setAgraSize(s,el){SD.agraSize=s;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcD();}
function toggleSticker(){SD.sticker=document.getElementById('chk-sticker').checked;document.getElementById('sticker-opts').classList.toggle('hidden',!SD.sticker);calcD();}
function setStickerMat(m,el){SD.stickerMat=m;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcD();}
function changeQty(d){SD.qtyD=Math.max(10,SD.qtyD+d);document.getElementById('qty-d').textContent=SD.qtyD;calcD();}
function calcD(){
  SD.margenD=parseInt(document.getElementById('margen-d').value);
  SD.liston=document.getElementById('chk-liston').checked;
  SD.stickerSize=parseFloat(document.getElementById('sticker-size').value)||5;
  var costo=SD.mat==='pvc'?C.pvc:SD.mat==='pp'?C.pp:C.lunchera;
  costo+=C.empaqueD;
  if(SD.liston)costo+=(C.lp/Math.max(1,C.lm))*(C.lcm/100);
  if(SD.agra){var w=6,h=SD.agraSize==='6x6'?6:12;var pz=Math.floor(21.6/w)*Math.floor(27.9/h);costo+=C.opal/Math.max(1,pz);}
  if(SD.sticker){var hw,hh,ph;if(SD.stickerMat==='foto'){hw=21.6;hh=27.9;ph=C.foto;}else if(SD.stickerMat==='vb'){hw=21.0;hh=29.7;ph=C.vb;}else{hw=21.6;hh=27.9;ph=C.vt;}var sp=Math.floor(hw/(SD.stickerSize+.5))*Math.floor(hh/(SD.stickerSize+.5));costo+=ph/Math.max(1,sp);}
  var precio=costo/(1-SD.margenD/100);
  var totalP=precio*SD.qtyD,totalC=costo*SD.qtyD;
  PRICES.dulceros={desc:'Bolsa dulcero personalizada — diseño + armado (todo incluido)',qty:SD.qtyD,unitPrice:precio};
  document.getElementById('res-dulceros').innerHTML=
    resCard('Costo / pieza',fmt(costo),'')+
    resCard('Precio sugerido / pza',fmt(precio),'Margen '+SD.margenD+'%',true)+
    resCard('Total ×'+SD.qtyD,fmtK(totalP),'')+
    resCard('Ganancia estimada',fmtK(totalP-totalC),'');
}

// ===== TATTOO STATION =====
function setTSSize(s,el){STS_S.size=s;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcTStation();}
function setTSPkg(p,el){STS_S.pkg=p;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');document.getElementById('ts-custom-qty').classList.toggle('hidden',p!==0);if(p>0){STS_S.customQty=p;document.getElementById('qty-ts').textContent=p;}calcTStation();}
function changeTSQty(d){STS_S.customQty=Math.max(5,STS_S.customQty+d);document.getElementById('qty-ts').textContent=STS_S.customQty;calcTStation();}
function calcTStation(){
  STS_S.margenTS=parseInt(document.getElementById('margen-ts').value);
  STS_S.diseno=document.getElementById('chk-ts-diseno').checked;
  var qty=STS_S.pkg>0?STS_S.pkg:STS_S.customQty;
  var pxh=Math.floor(21.6/(STS_S.size+.3))*Math.floor(27.9/(STS_S.size+.3));
  pxh=Math.max(1,pxh);
  var hojas=Math.ceil(qty/pxh);
  var costoTattoos=hojas*C.tattoo;
  var numEsponjas=Math.ceil(qty/10);
  var costoInsumos=C.atom100+numEsponjas*C.esponja;
  var costoTotal=costoTattoos+costoInsumos+(STS_S.diseno?C.disFee:0);
  var costoUnit=costoTotal/qty;
  var precioUnit=costoUnit/(1-STS_S.margenTS/100);
  var precioTotal=precioUnit*qty;
  var disenios=qty/10;
  var pkgLabel=STS_S.pkg>0?'Paquete '+qty+' pzas':'Custom '+qty+' pzas';
  PRICES.tattooStation={
    desc:'Tattoo Station — '+qty+' tatuajes temporales + atomizador 100ml personalizado + '+numEsponjas+' esponja'+(numEsponjas>1?'s':''),
    qty:qty,unitPrice:precioUnit
  };
  document.getElementById('res-ts').innerHTML=
    resCard('Piezas/hoja · Hojas',pxh+' · '+hojas,'Material tattoo')+
    resCard('Insumos (atom+esponjas)',fmt(costoInsumos),numEsponjas+' esponjas + 1 atom.')+
    resCard('Costo / tattoo',fmt(costoUnit),'')+
    resCard('Precio sugerido / tattoo',fmt(precioUnit),'Margen '+STS_S.margenTS+'%',true)+
    resCard(pkgLabel,fmtK(precioTotal),'')+
    resCard('Ganancia estimada',fmtK(precioTotal-costoTotal),'');
  document.getElementById('note-ts').textContent='Incluye 1 atomizador 100ml personalizado + '+numEsponjas+' esponja'+(numEsponjas>1?'s':'')+' de aplicación. Se crean '+Math.floor(disenios)+'-'+Math.ceil(disenios*2)+' diseños para el paquete de '+qty+' pzas. Factura CFDI +16% IVA.';
}

// ===== TATTOO KIT =====
function setTKSize(s,el){STK.size=s;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcTKit();}
function setTKPkg(b,el){STK.bolsas=b;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcTKit();}
function calcTKit(){
  STK.margenTK=parseInt(document.getElementById('margen-tk').value);
  var bolsas=STK.bolsas;
  var totalTattoos=bolsas*10;
  var pxh=Math.max(1,Math.floor(21.6/(STK.size+.3))*Math.floor(27.9/(STK.size+.3)));
  var hojas=Math.ceil(totalTattoos/pxh);
  var costoTattoosTotal=hojas*C.tattoo;
  var costoTattoosPerBolsa=costoTattoosTotal/bolsas;
  var opalPorHoja=Math.max(1,Math.floor(21.6/12)*Math.floor(27.9/12));
  var costoOpalPerCard=C.opal/opalPorHoja;
  var costoOtrosPorBolsa=C.atom30+C.esponja+C.celofan+costoOpalPerCard;
  var costoPerBolsa=costoTattoosPerBolsa+costoOtrosPorBolsa;
  var precioPerBolsa=costoPerBolsa/(1-STK.margenTK/100);
  var precioTotal=precioPerBolsa*bolsas;
  var pkgName=bolsas===10?'Petite':bolsas===20?'Medio':'Max';
  PRICES.tattooKit={
    desc:'Kit Bolsas Tattoo Personalizadas — Paquete '+pkgName+' ('+bolsas+' bolsas × 10 tatuajes c/u) + atomizador 30ml + esponja + empaque personalizado',
    qty:bolsas,unitPrice:precioPerBolsa
  };
  document.getElementById('res-tk').innerHTML=
    resCard('Tattoo cost/bolsa',fmt(costoTattoosPerBolsa),hojas+' hojas para '+totalTattoos+' tattoos')+
    resCard('Insumos/bolsa',fmt(costoOtrosPorBolsa),'atom+esponja+bolsa+opalina')+
    resCard('Costo/bolsa',fmt(costoPerBolsa),'')+
    resCard('Precio/bolsa',fmt(precioPerBolsa),'Margen '+STK.margenTK+'%',true)+
    resCard('Total paquete '+pkgName+' (×'+bolsas+')',fmtK(precioTotal),'')+
    resCard('Ganancia estimada',fmtK(precioTotal-costoPerBolsa*bolsas),'');
}

// ===== T-SHIRT LAB =====
function setTshirtTipo(t,el){STS.tipo=t;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');document.getElementById('mixto-opts').classList.toggle('hidden',t!=='mixto');calcTS();}
function changeTshirtQty(d){var el=document.getElementById('qty-tshirt');var v=Math.max(1,parseInt(el.value||'1')+d);el.value=v;calcTS();}
function calcTS(){
  STS.qty=Math.max(1,parseInt(document.getElementById('qty-tshirt').value)||1);
  STS.margen=parseInt(document.getElementById('margen-tshirt').value);
  STS.tallaEsp=document.getElementById('chk-talla-esp').checked;
  STS.area=parseFloat(document.getElementById('ts-area').value)||603;
  STS.mdo=parseFloat(document.getElementById('ts-mdo').value)||0;
  STS.traslado=parseFloat(document.getElementById('ts-traslado').value)||0;
  STS.otros=parseFloat(document.getElementById('ts-otros').value)||0;
  STS.mixtoInf=parseFloat(document.getElementById('ts-mixto-inf').value)||0;
  STS.mixtoAdu=parseFloat(document.getElementById('ts-mixto-adu').value)||0;
  document.getElementById('ts-lienzo-ref').textContent=C.lienzo;
  var costoImp=C.lienzo/Math.max(1,Math.floor(C.lienzoArea/STS.area));
  var costoPrenda;
  if(STS.tipo==='adulto')costoPrenda=C.adu;
  else if(STS.tipo==='infantil')costoPrenda=C.inf;
  else if(STS.tipo==='trae')costoPrenda=0;
  else{var tot=STS.mixtoInf+STS.mixtoAdu;costoPrenda=tot>0?(C.inf*STS.mixtoInf+C.adu*STS.mixtoAdu)/tot:(C.inf+C.adu)/2;}
  if(STS.tallaEsp)costoPrenda+=C.tallaEsp;
  var costoVarUnit=costoPrenda+costoImp+C.empaqueP;
  var fijos=STS.mdo+STS.traslado+STS.otros;
  var costoTotal=costoVarUnit*STS.qty+fijos;
  var costoUnitTotal=costoTotal/STS.qty;
  var precioUnit=costoUnitTotal/(1-STS.margen/100);
  var precioTotal=precioUnit*STS.qty;
  var precioIVA=precioTotal*1.16;
  var tipoPrenda=STS.tipo==='adulto'?'adulto':STS.tipo==='infantil'?'infantil (T. 2-12)':STS.tipo==='trae'?'(cliente trae prenda)':'mixto';
  PRICES.tshirt={desc:'T-Shirt Lab — Prenda '+tipoPrenda+' — diseño + impresión + empaque (todo incluido)',qty:STS.qty,unitPrice:precioUnit};
  document.getElementById('res-tshirt').innerHTML=
    resCard('Costo variable/pza',fmt(costoVarUnit),'')+
    resCard('Fijos prorrateados/pza',fmt(fijos/STS.qty),fmtK(fijos)+' total fijos')+
    resCard('Precio sugerido/pza',fmt(precioUnit),'Margen '+STS.margen+'%',true)+
    resCard('Total s/IVA',fmtK(precioTotal),'')+
    resCard('Total c/IVA',fmtK(precioIVA),'')+
    resCard('Ganancia total',fmtK(precioTotal-costoTotal),'');
}

// ===== CAP LAB =====
function setCapLabGorra(t,el){
  SCL.tipo=t;
  el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});
  el.classList.add('active');
  calcCL();
}
function setCapLabParche(t,el){
  SCL.parcheTipo=t;
  el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});
  el.classList.add('active');
  document.getElementById('caplab-mixto-opts').classList.toggle('hidden',t!=='mixto');
  calcCL();
}
function changeCapLabQty(d){
  var el=document.getElementById('qty-caplab');
  var v=Math.max(1,parseInt(el.value||'1')+d);
  el.value=v;
  calcCL();
}
function calcCL(){
  SCL.margen=parseInt(document.getElementById('margen-caplab').value);
  SCL.mdo=parseFloat(document.getElementById('cl-mdo').value)||0;
  SCL.traslado=parseFloat(document.getElementById('cl-traslado').value)||0;
  SCL.otros=parseFloat(document.getElementById('cl-otros').value)||0;
  SCL.qty=Math.max(1,parseInt(document.getElementById('qty-caplab').value)||1);
  SCL.mixtoEco=parseFloat(document.getElementById('cl-mixto-eco').value)||0;
  SCL.mixtoPremium=parseFloat(document.getElementById('cl-mixto-prem').value)||0;

  var costoGorra=SCL.tipo==='curva'?C.gorraC:C.gorraK;
  var costoParche;
  if(SCL.parcheTipo==='eco'){costoParche=C.parcheEco;}
  else if(SCL.parcheTipo==='premium'){costoParche=C.parchePremium;}
  else{
    var totM=SCL.mixtoEco+SCL.mixtoPremium;
    costoParche=totM>0?(C.parcheEco*SCL.mixtoEco+C.parchePremium*SCL.mixtoPremium)/totM:(C.parcheEco+C.parchePremium)/2;
  }

  var costoVarUnit=costoGorra+costoParche+C.empaqueP;
  var fijos=SCL.mdo+SCL.traslado+SCL.otros;
  var costoTotal=costoVarUnit*SCL.qty+fijos;
  var costoUnitTotal=costoTotal/SCL.qty;
  var precioUnit=costoUnitTotal/(1-SCL.margen/100);
  var precioTotal=precioUnit*SCL.qty;
  var precioIVA=precioTotal*1.16;

  var tipoGorraLabel=SCL.tipo==='curva'?'visera curva':'camionera 5 gajos';
  var tipoParLabel=SCL.parcheTipo==='eco'?'económico':SCL.parcheTipo==='premium'?'premium':'mixto eco+premium';

  PRICES.caplab={
    desc:'Cap Lab — Gorra acrílica '+tipoGorraLabel+' + parche bordado '+tipoParLabel+' — personalización en evento (todo incluido)',
    qty:SCL.qty,
    unitPrice:precioUnit
  };

  document.getElementById('res-caplab').innerHTML=
    resCard('Costo gorra/pza',fmt(costoGorra),SCL.tipo==='curva'?'Visera curva':'Camionera 5 gajos')+
    resCard('Costo parche/pza',fmt(costoParche),tipoParLabel)+
    resCard('Costo variable/pza',fmt(costoVarUnit),'')+
    resCard('Fijos prorrateados/pza',fmt(fijos/SCL.qty),fmtK(fijos)+' total fijos')+
    resCard('Precio sugerido/pza',fmt(precioUnit),'Margen '+SCL.margen+'%',true)+
    resCard('Total s/IVA',fmtK(precioTotal),'')+
    resCard('Total c/IVA',fmtK(precioIVA),'')+
    resCard('Ganancia total',fmtK(precioTotal-costoTotal),'');
}

// ===== PRENDAS =====
function setPrendasTipo(t,el){SP.tipo=t;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcP();}
function changePQty(d){SP.qty=Math.max(1,SP.qty+d);document.getElementById('qty-p').textContent=SP.qty;calcP();}
function setPArea(a,el){document.getElementById('area-chips').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');document.getElementById('area-custom').classList.toggle('hidden',a!==0);SP.area=a===0?(parseFloat(document.getElementById('p-area-custom').value)||300):a;calcP();}
function calcP(){
  SP.margen=parseInt(document.getElementById('margen-p').value);
  SP.tallaEsp=document.getElementById('chk-p-talla-esp').checked;
  if(!document.getElementById('area-custom').classList.contains('hidden'))SP.area=parseFloat(document.getElementById('p-area-custom').value)||300;
  var costoImp=C.lienzo/Math.max(1,Math.floor(C.lienzoArea/SP.area));
  var costoPrenda;
  if(SP.tipo==='adulto')costoPrenda=C.adu;
  else if(SP.tipo==='infantil')costoPrenda=C.inf;
  else if(SP.tipo==='tote')costoPrenda=C.tote;
  else costoPrenda=0;
  if(SP.tallaEsp)costoPrenda+=C.tallaEsp;
  var costoUnit=costoPrenda+costoImp+C.empaqueP;
  var precioUnit=costoUnit/(1-SP.margen/100);
  var precioTotal=precioUnit*SP.qty;
  var precioIVA=precioTotal*1.16;
  var costoTotal=costoUnit*SP.qty;
  var gananciaTotal=precioTotal-costoTotal;
  var gananciaUnit=precioUnit-costoUnit;
  var tipoPrenda=SP.tipo==='adulto'?'adulto':SP.tipo==='infantil'?'infantil (T. 2-12)':SP.tipo==='tote'?'tote bag':'(cliente trae prenda)';
  PRICES.prendas={desc:'Prenda personalizada '+tipoPrenda+' — diseño + impresión (todo incluido)',qty:SP.qty,unitPrice:precioUnit};
  document.getElementById('res-prendas').innerHTML=
    resCard('Costo/pieza',fmt(costoUnit),'')+
    resCard('Precio sugerido/pza',fmt(precioUnit),'Margen '+SP.margen+'%',true)+
    resCard('Total ×'+SP.qty+' s/IVA',fmtK(precioTotal),'')+
    resCard('Total ×'+SP.qty+' c/IVA',fmtK(precioIVA),'')+
    resCard('Ganancia/pieza',fmt(gananciaUnit),'')+
    resCard('Ganancia estimada total',fmtK(gananciaTotal),'×'+SP.qty+' pzas · margen '+SP.margen+'%');
}

// ===== STICKERS =====
function setStkMat(m,el){SST.mat=m;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');var isMag=m==='mag';document.getElementById('stk-mag-note').classList.toggle('hidden',!isMag);if(isMag){var lamChips=document.getElementById('stk-lam-chips');lamChips.querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});lamChips.children[1].classList.add('active');SST.lam='liso';}calcStk();}
function setStkLam(l,el){if(SST.mat==='mag'&&l==='none'){showToast('⚠ El papel magnético requiere laminado liso');return;}SST.lam=l;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcStk();}
function setStkCut(c,el){SST.cut=c;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(x){x.classList.remove('active')});el.classList.add('active');calcStk();}
function changeStkQty(d){var el=document.getElementById('qty-stk');var v=Math.max(1,parseInt(el.value||'1')+d);el.value=v;calcStk();}
function changePlanQty(d){var el=document.getElementById('qty-plan');var v=Math.max(1,parseInt(el.value||'1')+d);el.value=v;calcStk();}
function setPlanPPH(n,el){
  document.getElementById('plan-pph-chips').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});
  el.classList.add('active');
  SST.planPPH=n;
  document.getElementById('plan-pph-custom').classList.toggle('hidden',n!==0);
  calcStk();
}
function calcStk(){
  var m=MATS[SST.mat];
  var matCost=C[m.cKey];
  var lamCost=0;
  if(SST.mat==='mag'){lamCost=C.lamLiso;}
  else if(SST.lam==='liso'){lamCost=C.lamLiso;}
  else if(SST.lam==='tex'){lamCost=C.lamTex;}
  var sheetCost=matCost+lamCost;
  // Área útil según método de corte
  var sheetW=m.w, sheetH=m.h;
  if(SST.cut==='ds'){
    if(m.size==='carta'){sheetW=18.8;sheetH=25.0;}
    else{sheetW=18.3;sheetH=26.9;}
  }
  var cutLabel=SST.cut==='ds'?'Design Space':'Sin marcas de registro';
  // Nota del método de corte
  var cutNoteEl=document.getElementById('stk-cut-note');
  if(cutNoteEl){
    if(SST.cut==='ds'){
      cutNoteEl.textContent='Design Space: área útil '+sheetW+'×'+sheetH+' cm en hoja '+m.size+' ('+m.w+'×'+m.h+' cm). Recomendado para corte automático con marcas de registro.';
      cutNoteEl.style.color='var(--purple)';
    } else {
      cutNoteEl.textContent='Sin marcas de registro: aprovecha la hoja completa '+m.w+'×'+m.h+' cm ('+m.size+'). Corte manual o sin software de registro.';
      cutNoteEl.style.color='var(--muted)';
    }
  }
  var margen,diseno,qty,resId;

  if(SST.type==='troquelado'){
    SST.w=parseFloat(document.getElementById('stk-w').value)||5;
    SST.h=parseFloat(document.getElementById('stk-h').value)||5;
    SST.qty=Math.max(1,parseInt(document.getElementById('qty-stk').value)||1);
    SST.diseno=document.getElementById('chk-stk-diseno').checked;
    var disFeeCustom=parseFloat(document.getElementById('stk-dis-fee-custom').value)||0;
    margen=parseInt(document.getElementById('margen-stk').value);
    SST.margenTro=margen;diseno=SST.diseno;qty=SST.qty;resId='res-stk-tro';
    var gap=0.3;
    var pxh=Math.max(1,Math.floor(sheetW/(SST.w+gap))*Math.floor(sheetH/(SST.h+gap)));
    var fitWarn=(SST.w+gap)>sheetW||(SST.h+gap)>sheetH;
    var hojas=Math.ceil(qty/pxh);
    var costoMatTotal=hojas*sheetCost;
    var feeDis=diseno?disFeeCustom:0;
    var costoTotal=costoMatTotal+feeDis;
    var costoUnit=costoTotal/qty;
    var feePerUnit=feeDis/qty;
    var matPerUnit=costoMatTotal/qty;
    var precioUnit=costoUnit/(1-margen/100);
    var precioTotal=precioUnit*qty;
    var lamLabel=SST.mat==='mag'?'liso (incluido)':SST.lam==='none'?'sin laminado':SST.lam==='liso'?'liso':'texturizado';
    // Desglose fee
    var desgloseEl=document.getElementById('stk-dis-desglose');
    if(diseno&&disFeeCustom>0){
      desgloseEl.textContent='Fee $'+disFeeCustom.toFixed(0)+' ÷ '+qty+' pzas = $'+feePerUnit.toFixed(2)+'/sticker por diseño (material: $'+matPerUnit.toFixed(2)+'/sticker)';
      desgloseEl.style.color='var(--purple)';
    } else {
      desgloseEl.textContent=diseno?'Fee en $0 — sin cargo por diseño.':'Sin fee de diseño incluido.';
      desgloseEl.style.color='var(--muted)';
    }
    PRICES.stickers={
      desc:'Stickers troquelados full personalizados en '+m.label+' — '+SST.w+'×'+SST.h+'cm — diseño + impresión + corte'+(SST.lam!=='none'||SST.mat==='mag'?' + laminado':'')+' (todo incluido)',
      qty:qty,unitPrice:precioUnit
    };
    document.getElementById(resId).innerHTML=
      resCard('Piezas/hoja · Hojas',pxh+' · '+hojas,'Material: '+m.label)+
      resCard('Material/sticker','$'+matPerUnit.toFixed(2),'Lam: '+lamLabel)+
      resCard('Diseño/sticker','$'+feePerUnit.toFixed(2),diseno?'Fee $'+disFeeCustom.toFixed(0)+' amortizado':'No incluido')+
      resCard('Costo total/sticker','$'+costoUnit.toFixed(2),'')+
      resCard('Precio sugerido/pza','$'+precioUnit.toFixed(2),'Margen '+margen+'%',true)+
      resCard('Total ×'+qty,fmtK(precioTotal),'')+
      resCard('Ganancia estimada',fmtK(precioTotal-costoTotal),'');
    document.getElementById('stk-tro-note').textContent=pxh+' stickers por hoja '+m.size+' ('+cutLabel+', área útil '+sheetW+'×'+sheetH+'cm). Necesitas '+hojas+' hoja'+(hojas>1?'s':'')+'. Laminado: '+lamLabel+'. '+(fitWarn?'⚠ El sticker ('+SST.w+'×'+SST.h+'cm) NO cabe en el área útil — revisa medidas. ':'')+(diseno&&disFeeCustom>0?'Fee de diseño $'+disFeeCustom.toFixed(0)+' amortizado en '+qty+' pzas.':'Sin fee de diseño.');
  } else if(SST.type==='planilla'){
    // PLANILLAS
    SST.qtyPlan=Math.max(1,parseInt(document.getElementById('qty-plan').value)||1);
    SST.disenoPlan=document.getElementById('chk-plan-diseno').checked;
    margen=parseInt(document.getElementById('margen-plan').value);
    SST.margenPlan=margen;diseno=SST.disenoPlan;qty=SST.qtyPlan;resId='res-stk-plan';
    var planDisFee=parseFloat(document.getElementById('plan-dis-fee-custom').value)||0;

    // planillas por hoja
    var pph=SST.planPPH>0?SST.planPPH:(parseFloat(document.getElementById('plan-pph-num').value)||1);
    var hojasNecesarias=Math.ceil(qty/pph);
    var costoMatPlanilla=sheetCost/pph;   // costo de material por planilla (fracción de hoja)
    var costoMatTotal2=hojasNecesarias*sheetCost;
    var feeDis2=diseno?planDisFee:0;
    var costoTotal2=costoMatTotal2+feeDis2;
    var costoUnit2=costoTotal2/qty;
    var feePerPlan=feeDis2/qty;
    var matPerPlan=costoMatPlanilla;
    var precioUnit2=costoUnit2/(1-margen/100);
    var precioTotal2=precioUnit2*qty;

    // nota informativa de planillas/hoja
    var pphLabel=pph===1?'hoja completa':pph===2?'½ hoja':pph===4?'¼ hoja':pph+' partes/hoja';
    document.getElementById('plan-pph-note').textContent=
      'Cada planilla ocupa 1/'+pph+' de la hoja ('+pphLabel+'). '+qty+' planillas requieren '+hojasNecesarias+' hoja'+(hojasNecesarias>1?'s':'')+' completa'+(hojasNecesarias>1?'s':'')+'. Costo material/planilla: $'+costoMatPlanilla.toFixed(2)+'.';

    // desglose fee planillas
    var desgloseElP=document.getElementById('plan-dis-desglose');
    if(diseno&&planDisFee>0){
      desgloseElP.textContent='Fee $'+planDisFee.toFixed(0)+' ÷ '+qty+' planillas = $'+feePerPlan.toFixed(2)+'/planilla por diseño (material: $'+matPerPlan.toFixed(2)+'/planilla)';
      desgloseElP.style.color='var(--purple)';
    } else {
      desgloseElP.textContent=diseno?'Fee en $0 — sin cargo por diseño.':'Sin fee de diseño incluido.';
      desgloseElP.style.color='var(--muted)';
    }

    PRICES.stickers={
      desc:'Planilla de stickers personalizados en '+m.label+' ('+pphLabel+' de hoja) — diseño + impresión'+(SST.lam!=='none'||SST.mat==='mag'?' + laminado':'')+' (todo incluido)',
      qty:qty,unitPrice:precioUnit2
    };
    document.getElementById(resId).innerHTML=
      resCard('Hojas necesarias',hojasNecesarias+'','×'+pph+' planillas por hoja')+
      resCard('Material/planilla','$'+costoMatPlanilla.toFixed(2),m.label+(pph>1?' (÷'+pph+')':''))+
      resCard('Diseño/planilla','$'+feePerPlan.toFixed(2),diseno?'Fee $'+planDisFee.toFixed(0)+' amortizado':'No incluido')+
      resCard('Costo total/planilla','$'+costoUnit2.toFixed(2),'')+
      resCard('Precio/planilla','$'+precioUnit2.toFixed(2),'Margen '+margen+'%',true)+
      resCard('Total ×'+qty,fmtK(precioTotal2),'')+
      resCard('Ganancia estimada',fmtK(precioTotal2-costoTotal2),'');
    document.getElementById('plan-note').textContent='Cada planilla = 1/'+pph+' de una hoja '+m.size+'. '+hojasNecesarias+' hoja'+(hojasNecesarias>1?'s':'')+' comprada'+(hojasNecesarias>1?'s':'')+' para '+qty+' planillas. '+(diseno&&planDisFee>0?'Fee de diseño $'+planDisFee.toFixed(0)+' amortizado.':'');
  } else {
    // ETIQUETAS UV (DTF UV)
    SST.wUV=parseFloat(document.getElementById('uv-w').value)||5;
    SST.hUV=parseFloat(document.getElementById('uv-h').value)||5;
    SST.qtyUV=Math.max(1,parseInt(document.getElementById('qty-uv').value)||1);
    SST.disenoUV=document.getElementById('chk-uv-diseno').checked;
    SST.disFeeUV=parseFloat(document.getElementById('uv-dis-fee').value)||0;
    SST.margenUV=parseInt(document.getElementById('margen-uv').value);
    var wU=SST.wUV,hU=SST.hUV,qtyU=SST.qtyUV,disU=SST.disenoUV,disFeeU=SST.disFeeUV,margenU=SST.margenUV;
    // Lienzo DTF UV (dimensiones y precio internos — solo se muestran en pestaña Insumos)
    var lienzoW=C.dtfUVW||38, lienzoH=C.dtfUVL||100, lienzoCost=C.dtfUVPrice||450;
    var gapU=0.3;
    var fitsW=Math.floor(lienzoW/(wU+gapU));
    var fitsH=Math.floor(lienzoH/(hU+gapU));
    var pxhU=Math.max(1,fitsW*fitsH);
    var fitWarnU=(wU+gapU)>lienzoW||(hU+gapU)>lienzoH;
    var lienzosU=Math.ceil(qtyU/pxhU);
    var costoMatTotalU=lienzosU*lienzoCost;
    var feeDisU=disU?disFeeU:0;
    var costoTotalU=costoMatTotalU+feeDisU;
    var costoUnitU=costoTotalU/qtyU;
    var feePerUnitU=feeDisU/qtyU;
    var matPerUnitU=costoMatTotalU/qtyU;
    var precioUnitU=costoUnitU/(1-margenU/100);
    var precioTotalU=precioUnitU*qtyU;
    // Desglose fee
    var desgloseElU=document.getElementById('uv-dis-desglose');
    if(disU&&disFeeU>0){
      desgloseElU.textContent='Fee $'+disFeeU.toFixed(0)+' ÷ '+qtyU+' pzas = $'+feePerUnitU.toFixed(2)+'/etiqueta por diseño (material: $'+matPerUnitU.toFixed(2)+'/etiqueta)';
      desgloseElU.style.color='var(--cyan)';
    } else {
      desgloseElU.textContent=disU?'Fee en $0 — sin cargo por diseño.':'Sin fee de diseño incluido.';
      desgloseElU.style.color='var(--muted)';
    }
    PRICES.stickers={
      desc:'Etiquetas UV personalizadas — '+wU+'×'+hU+'cm — impresión DTF UV + corte (todo incluido)',
      qty:qtyU,unitPrice:precioUnitU
    };
    document.getElementById('res-stk-uv').innerHTML=
      resCard('Etiquetas/lienzo · Lienzos',pxhU+' · '+lienzosU,'DTF UV')+
      resCard('Material/etiqueta','$'+matPerUnitU.toFixed(2),'Impresión UV')+
      resCard('Diseño/etiqueta','$'+feePerUnitU.toFixed(2),disU?'Fee $'+disFeeU.toFixed(0)+' amortizado':'No incluido')+
      resCard('Costo total/etiqueta','$'+costoUnitU.toFixed(2),'')+
      resCard('Precio sugerido/pza','$'+precioUnitU.toFixed(2),'Margen '+margenU+'%',true)+
      resCard('Total ×'+qtyU,fmtK(precioTotalU),'')+
      resCard('Ganancia estimada',fmtK(precioTotalU-costoTotalU),'');
    document.getElementById('uv-note').textContent=pxhU+' etiquetas por lienzo. Necesitas '+lienzosU+' lienzo'+(lienzosU>1?'s':'')+' DTF UV. '+(fitWarnU?'⚠ La etiqueta ('+wU+'×'+hU+'cm) NO cabe en el lienzo — revisa medidas. ':'')+(disU&&disFeeU>0?'Fee de diseño $'+disFeeU.toFixed(0)+' amortizado en '+qtyU+' pzas.':'Sin fee de diseño.');
  }
}

// ===== COTIZACIÓN =====
function getCotNumStr(){return'COT-'+String(COT.cotNum).padStart(3,'0');}
function syncCotNum(v){var m=v.match(/\d+/);if(m){COT.cotNum=parseInt(m[0]);}document.getElementById('cot-num-display').textContent=getCotNumStr();document.getElementById('cot-num-input').value=getCotNumStr();}
function prevCotNum(){COT.cotNum=Math.max(1,COT.cotNum-1);syncCotNum(getCotNumStr());}
function nextCotNum(){COT.cotNum++;syncCotNum(getCotNumStr());}
function setIva(b,el){COT.iva=b;el.closest('.pill-toggle').querySelectorAll('.pill-opt').forEach(function(o){o.classList.remove('active')});el.classList.add('active');document.getElementById('iva-row').style.display=b?'flex':'none';renderCotLines();}

function addToCot(serviceKey){
  var p=PRICES[serviceKey];
  if(!p||p.qty===0||p.unitPrice===0){showToast('⚠ Primero configura y calcula el servicio');return;}
  COT.lines.push({id:Date.now(),desc:p.desc,qty:p.qty,unitPrice:p.unitPrice});
  renderCotLines();
  showToast('✓ Añadido a cotización ('+getCotNumStr()+')');
  var tipoEl=document.getElementById('cot-tipo');
  if(!tipoEl.value){
    var labels={dulceros:'Bolsas Dulceros',tattooStation:'Tattoo Station',tattooKit:'Tattoo Kit Bolsas',tshirt:'T-Shirt Lab',caplab:'Cap Lab',prendas:'Prendas Personalizadas',stickers:'Stickers Personalizados',imanes:'Imanes Personalizados',accTagLlavero:'Accesorios Tags / Llaveros',accVasos:'Vasos Personalizados',laser:'Grabado / Corte Láser',print3d:'Impresión 3D'};
    tipoEl.value=labels[serviceKey]||'';
  }
}
function addManualLine(){
  COT.lines.push({id:Date.now(),desc:'',qty:1,unitPrice:0});
  renderCotLines();
}
function removeCotLine(id){COT.lines=COT.lines.filter(function(l){return l.id!==id;});renderCotLines();}
function renderCotLines(){
  var body=document.getElementById('cot-lines-body');
  if(COT.lines.length===0){body.innerHTML='<div class="cot-empty" id="cot-empty-msg">No hay servicios añadidos. Usa el botón "↓ Añadir a cotización" en cada módulo o agrega una línea manual.</div>';calcCotTotals();return;}
  var html='';
  COT.lines.forEach(function(l){
    html+='<div class="cot-line-row" data-id="'+l.id+'">'
      +'<input type="text" value="'+escH(l.desc)+'" onchange="updateLine('+l.id+',\'desc\',this.value)" style="width:100%;font-size:12px;padding:4px 8px">'
      +'<input type="number" value="'+l.qty+'" min="1" onchange="updateLine('+l.id+',\'qty\',this.value)" style="width:100%;font-size:12px;padding:4px 8px">'
      +'<input type="number" value="'+l.unitPrice.toFixed(2)+'" min="0" step="0.01" onchange="updateLine('+l.id+',\'unitPrice\',this.value)" style="width:100%;font-size:12px;padding:4px 8px">'
      +'<span class="cot-line-total">'+fmtK(l.qty*l.unitPrice)+'</span>'
      +'<button class="cot-del-btn" onclick="removeCotLine('+l.id+')">✕</button>'
      +'</div>';
  });
  body.innerHTML=html;
  calcCotTotals();
}
function updateLine(id,field,val){
  var l=COT.lines.find(function(x){return x.id===id;});
  if(!l)return;
  if(field==='qty')l.qty=Math.max(1,parseInt(val)||1);
  else if(field==='unitPrice')l.unitPrice=parseFloat(val)||0;
  else l[field]=val;
  var row=document.querySelector('[data-id="'+id+'"]');
  if(row)row.querySelector('.cot-line-total').textContent=fmtK(l.qty*l.unitPrice);
  calcCotTotals();
}
function calcCotTotals(){
  var sub=COT.lines.reduce(function(s,l){return s+l.qty*l.unitPrice;},0);
  var iva=COT.iva?sub*0.16:0;
  var total=sub+iva;
  document.getElementById('tot-sub').textContent=fmtK(sub);
  document.getElementById('tot-iva').textContent=fmtK(iva);
  document.getElementById('tot-total').textContent=fmtK(total);
}
function clearCot(){if(confirm('¿Limpiar todas las líneas de la cotización?')){COT.lines=[];renderCotLines();document.getElementById('cot-notas').value='';}}

// ===== CONSTRUIR PÁGINA PDF (dinámica) =====
function buildOnePDFPage(cotNum,lines,cd,addPageBreak){
  var sub=0;
  var rows='';
  lines.forEach(function(l){
    var imp=l.qty*l.unitPrice;sub+=imp;
    rows+='<tr><td>'+escH(l.desc)+'</td><td style="text-align:center">'+l.qty+'</td><td style="text-align:center">$'+l.unitPrice.toFixed(2)+'</td><td style="text-align:center">$'+Math.round(imp).toLocaleString('es-MX')+'</td></tr>';
  });
  var iva=cd.iva?sub*0.16:0;
  var total=sub+iva;
  var subHtml='<div class="pdf-sub-row"><span>SUBTOTAL</span><span>$'+Math.round(sub).toLocaleString('es-MX')+'</span></div>';
  if(cd.iva)subHtml+='<div class="pdf-sub-row"><span>IVA (16%)</span><span>$'+Math.round(iva).toLocaleString('es-MX')+'</span></div>';
  subHtml+='<div class="pdf-total-bar"><span class="t-label">▶ TOTAL A PAGAR'+(cd.iva?'':' <small>(Sin IVA)</small>')+'</span><span class="t-amount">$'+Math.round(total).toLocaleString('es-MX')+'.00</span></div>';

  var condHtml='';
  if(cd.notas){
    cd.notas.split('\n').forEach(function(line){
      if(!line.trim())return;
      var parts=line.split(':');
      if(parts.length>=2){condHtml+='<div class="pdf-cond-item"><span class="pdf-cond-label">✦ '+escH(parts[0].trim())+':</span><span>'+escH(parts.slice(1).join(':').trim())+'</span></div>';}
      else{condHtml+='<div class="pdf-cond-item"><span>✦ '+escH(line)+'</span></div>';}
    });
  }
  condHtml+='<div class="pdf-cond-item"><span class="pdf-cond-label">✦ Facturación:</span><span>En caso de requerir CFDI, se añade 16% de IVA al total de la orden.</span></div>';
  condHtml+='<div class="pdf-cond-item"><span class="pdf-cond-label">✦ Vigencia:</span><span>Esta cotización tiene validez de '+escH(cd.vigencia)+' a partir de la fecha de emisión.</span></div>';

  return '<div class="pdf-page'+(addPageBreak?' pdf-page-break':'')+'">'
    +'<div class="pdf-green-bar"></div>'
    +'<div class="pdf-header"><div class="pdf-header-row">'
      +'<div>'
        +'<div class="pdf-logo-name">MatrixLab</div>'
        +'<div class="pdf-logo-sub">Papelería Creativa &amp; T-Shirt Lab &amp; Cap Lab</div>'
        +'<div class="pdf-logo-slogan">Donde tus ideas hacen click.</div>'
      +'</div>'
      +'<div class="pdf-cot-title">COTIZACIÓN DE SERVICIO</div>'
    +'</div></div>'
    +'<div class="pdf-contact-bar">'
      +'<span><strong>📷</strong> @MatrixLab.Stickers &nbsp; <strong>📱</strong> 5655575131</span>'
      +'<em>Smart tools for brilliant minds ✦</em>'
    +'</div>'
    +'<div class="pdf-body">'
      +'<div class="pdf-info-grid">'
        +'<div class="pdf-info-half">'
          +'<div class="pdf-info-header"><span>📋</span> DATOS DE LA COTIZACIÓN</div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">N° de Cotización:</span><span class="pdf-info-val v-purple">'+escH(cotNum)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Fecha de cotización:</span><span class="pdf-info-val">'+escH(cd.fecha)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Vigencia:</span><span class="pdf-info-val">'+escH(cd.vigencia)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Tipo de servicio:</span><span class="pdf-info-val">'+escH(cd.tipo)+'</span></div>'
        +'</div>'
        +'<div class="pdf-info-half" style="border-left:1px solid #dee2e6">'
          +'<div class="pdf-info-header alt"><span>👤</span> DATOS DEL CLIENTE</div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Cliente / Evento:</span><span class="pdf-info-val v-green">'+escH(cd.cliente)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Teléfono / Email:</span><span class="pdf-info-val">'+escH(cd.tel)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Fecha del evento:</span><span class="pdf-info-val">'+escH(cd.fechaEv)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Dirección / Lugar:</span><span class="pdf-info-val">'+escH(cd.lugar)+'</span></div>'
        +'</div>'
      +'</div>'
      +'<div class="pdf-section-hd"><span>✏</span> DETALLE DEL SERVICIO</div>'
      +'<table class="pdf-table"><thead><tr>'
        +'<th>Concepto</th><th>Cant.</th><th>P. Unit.</th><th>Importe</th>'
      +'</tr></thead><tbody>'+rows+'</tbody></table>'
      +subHtml
      +'<div class="pdf-conditions"><div class="pdf-section-hd" style="border-radius:0"><span>📌</span> CONDICIONES DEL SERVICIO</div><div class="pdf-cond-body">'+condHtml+'</div></div>'
    +'</div>'
    +'<div class="pdf-footer-bar">'
      +'<div class="fl">MatrixLab Stickers · <span>Papelería Creativa &amp; T-Shirt Lab &amp; Cap Lab</span></div>'
      +'<div class="fr"><strong>📷 @MatrixLab.Stickers</strong> &nbsp; 📱 WA: 5655575131 &nbsp; ✦ Smart tools for brilliant minds</div>'
    +'</div>'
    +'<div class="pdf-green-bar"></div>'
  +'</div>';
}

// ===== GENERAR PDF =====
function generatePDF(integrated){
  if(COT.lines.length===0){showToast('⚠ Añade al menos un servicio');return;}

  var today=new Date();
  var fechaStr=String(today.getDate()).padStart(2,'0')+'/'+String(today.getMonth()+1).padStart(2,'0')+'/'+today.getFullYear();
  var fechaEvEl=document.getElementById('cot-fecha-evento').value;

  var cd={
    fecha:fechaStr,
    vigencia:document.getElementById('cot-vigencia').value||'15 días',
    tipo:document.getElementById('cot-tipo').value||'Servicios MatrixLab',
    cliente:document.getElementById('cot-cliente').value||'—',
    tel:document.getElementById('cot-tel').value||'—',
    fechaEv:fechaEvEl?formatDate(fechaEvEl):'Por confirmar',
    lugar:document.getElementById('cot-lugar').value||'—',
    notas:document.getElementById('cot-notas').value,
    iva:COT.iva
  };

  var template=document.getElementById('print-template');

  if(integrated||COT.lines.length===1){
    // ── INTEGRADA: todas las líneas en una sola hoja ──
    template.innerHTML=buildOnePDFPage(getCotNumStr(),COT.lines,cd,false);
    saveCotForLater(getCotNumStr(),cd,COT.lines);
    localStorage.setItem('mlCotNum',COT.cotNum+1);
  } else {
    // ── INDIVIDUAL: una hoja por servicio con COT consecutivos ──
    var html='';
    COT.lines.forEach(function(l,i){
      var cotNum='COT-'+String(COT.cotNum+i).padStart(3,'0');
      html+=buildOnePDFPage(cotNum,[l],cd,i>0);
      saveCotForLater(cotNum,cd,[l]);
    });
    template.innerHTML=html;
    localStorage.setItem('mlCotNum',COT.cotNum+COT.lines.length);
  }

  setTimeout(function(){window.print();},150);
}

// ===== GUARDAR COTIZACIÓN PARA RECIBOS =====
function saveCotForLater(cotNum,cd,lines){
  try{
    var saved=JSON.parse(localStorage.getItem('mlSavedCots')||'[]');
    // Avoid duplicates of the same cotNum: replace if exists
    saved=saved.filter(function(s){return s.cotNum!==cotNum;});
    saved.unshift({
      cotNum:cotNum,
      fecha:cd.fecha,
      cliente:cd.cliente,
      tel:cd.tel,
      lugar:cd.lugar,
      tipo:cd.tipo,
      iva:cd.iva,
      lines:lines.map(function(l){return{desc:l.desc,qty:l.qty,unitPrice:l.unitPrice};})
    });
    if(saved.length>50)saved=saved.slice(0,50);
    localStorage.setItem('mlSavedCots',JSON.stringify(saved));
  }catch(e){/* ignore storage errors */}
}

function formatDate(iso){var p=iso.split('-');return p[2]+'/'+p[1]+'/'+p[0];}

// ===================================================================
// ===== RECIBOS =====================================================
// ===================================================================
function getRecNumStr(){return'REC-'+String(REC.recNum).padStart(3,'0');}
function syncRecNum(v){var m=v.match(/\d+/);if(m){REC.recNum=parseInt(m[0]);}document.getElementById('rec-num-display').textContent=getRecNumStr();document.getElementById('rec-num-input').value=getRecNumStr();}
function prevRecNum(){REC.recNum=Math.max(1,REC.recNum-1);syncRecNum(getRecNumStr());}
function nextRecNum(){REC.recNum++;syncRecNum(getRecNumStr());}
function setRecIva(b,el){REC.iva=b;el.closest('.pill-toggle').querySelectorAll('.pill-opt').forEach(function(o){o.classList.remove('active')});el.classList.add('active');document.getElementById('rec-iva-row').style.display=b?'flex':'none';calcRecTotals();}
function setRecPay(p,el){REC.payMethod=p;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');}

// Líneas
function addRecLine(){REC.lines.push({id:Date.now()+Math.random(),desc:'',qty:1,unitPrice:0});renderRecLines();}
function removeRecLine(id){REC.lines=REC.lines.filter(function(l){return l.id!==id;});renderRecLines();}
function updateRecLine(id,field,val){
  var l=REC.lines.find(function(x){return x.id===id;});
  if(!l)return;
  if(field==='qty')l.qty=Math.max(1,parseInt(val)||1);
  else if(field==='unitPrice')l.unitPrice=parseFloat(val)||0;
  else l[field]=val;
  var row=document.querySelector('#rec-lines-body [data-id="'+id+'"]');
  if(row)row.querySelector('.cot-line-total').textContent=fmtK(l.qty*l.unitPrice);
  calcRecTotals();
}
function renderRecLines(){
  var body=document.getElementById('rec-lines-body');
  if(REC.lines.length===0){body.innerHTML='<div class="cot-empty" id="rec-empty-msg">No hay conceptos. Carga desde una cotización o agrega líneas manualmente.</div>';calcRecTotals();return;}
  var html='';
  REC.lines.forEach(function(l){
    html+='<div class="cot-line-row" data-id="'+l.id+'">'
      +'<input type="text" value="'+escH(l.desc)+'" onchange="updateRecLine('+l.id+',\'desc\',this.value)" style="width:100%;font-size:12px;padding:4px 8px">'
      +'<input type="number" value="'+l.qty+'" min="1" onchange="updateRecLine('+l.id+',\'qty\',this.value)" style="width:100%;font-size:12px;padding:4px 8px">'
      +'<input type="number" value="'+l.unitPrice.toFixed(2)+'" min="0" step="0.01" onchange="updateRecLine('+l.id+',\'unitPrice\',this.value)" style="width:100%;font-size:12px;padding:4px 8px">'
      +'<span class="cot-line-total">'+fmtK(l.qty*l.unitPrice)+'</span>'
      +'<button class="cot-del-btn" onclick="removeRecLine('+l.id+')">✕</button>'
      +'</div>';
  });
  body.innerHTML=html;
  calcRecTotals();
}
function calcRecTotals(){
  var sub=REC.lines.reduce(function(s,l){return s+l.qty*l.unitPrice;},0);
  var iva=REC.iva?sub*0.16:0;
  var total=sub+iva;
  document.getElementById('rec-tot-sub').textContent=fmtK(sub);
  document.getElementById('rec-tot-iva').textContent=fmtK(iva);
  document.getElementById('rec-tot-total').textContent=fmtK(total);
}
function clearRec(){
  if(!confirm('¿Limpiar todos los datos del recibo?'))return;
  REC.lines=[];
  ['rec-cliente','rec-tel','rec-lugar','rec-tipo','rec-cot-ref','rec-pay-ref','rec-notas'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('rec-cot-saved').value='';
  document.getElementById('rec-cot-file').value='';
  REC.attachment=null;
  document.getElementById('rec-attachment-info').classList.add('hidden');
  renderRecLines();
}

// Cargar de cotización actual (la que está en la pestaña Cotización)
function loadFromCurrentCot(){
  if(COT.lines.length===0){showToast('⚠ La pestaña Cotización está vacía');return;}
  // Copiar líneas
  REC.lines=COT.lines.map(function(l){return{id:Date.now()+Math.random(),desc:l.desc,qty:l.qty,unitPrice:l.unitPrice};});
  // Copiar datos del cliente
  document.getElementById('rec-cliente').value=document.getElementById('cot-cliente').value||'';
  document.getElementById('rec-tel').value=document.getElementById('cot-tel').value||'';
  document.getElementById('rec-lugar').value=document.getElementById('cot-lugar').value||'';
  document.getElementById('rec-tipo').value=document.getElementById('cot-tipo').value||'';
  document.getElementById('rec-cot-ref').value=getCotNumStr();
  REC.iva=COT.iva;
  // Actualizar IVA toggle UI
  var ivaToggle=document.getElementById('rec-iva-toggle');
  ivaToggle.querySelectorAll('.pill-opt').forEach(function(o){o.classList.remove('active')});
  ivaToggle.querySelectorAll('.pill-opt')[REC.iva?1:0].classList.add('active');
  document.getElementById('rec-iva-row').style.display=REC.iva?'flex':'none';
  renderRecLines();
  showToast('✓ Datos cargados desde '+getCotNumStr());
}

// Lista de cotizaciones guardadas
function getSavedCots(){
  try{return JSON.parse(localStorage.getItem('mlSavedCots')||'[]');}catch(e){return[];}
}
function refreshSavedCotDropdown(){
  var sel=document.getElementById('rec-cot-saved');
  if(!sel)return;
  var saved=getSavedCots();
  var current=sel.value;
  sel.innerHTML='<option value="">— Cargar de cotización guardada —</option>';
  saved.forEach(function(s){
    var label=s.cotNum+' · '+(s.cliente||'sin cliente')+' · '+s.fecha;
    sel.innerHTML+='<option value="'+escH(s.cotNum)+'">'+escH(label)+'</option>';
  });
  sel.value=current;
}
function loadFromSavedCot(cotNum){
  if(!cotNum)return;
  var saved=getSavedCots();
  var s=saved.find(function(x){return x.cotNum===cotNum;});
  if(!s){showToast('⚠ Cotización no encontrada');return;}
  REC.lines=s.lines.map(function(l){return{id:Date.now()+Math.random(),desc:l.desc,qty:l.qty,unitPrice:l.unitPrice};});
  document.getElementById('rec-cliente').value=s.cliente||'';
  document.getElementById('rec-tel').value=s.tel||'';
  document.getElementById('rec-lugar').value=s.lugar||'';
  document.getElementById('rec-tipo').value=s.tipo||'';
  document.getElementById('rec-cot-ref').value=s.cotNum;
  REC.iva=!!s.iva;
  var ivaToggle=document.getElementById('rec-iva-toggle');
  ivaToggle.querySelectorAll('.pill-opt').forEach(function(o){o.classList.remove('active')});
  ivaToggle.querySelectorAll('.pill-opt')[REC.iva?1:0].classList.add('active');
  document.getElementById('rec-iva-row').style.display=REC.iva?'flex':'none';
  renderRecLines();
  showToast('✓ Datos cargados desde '+cotNum);
}
function clearSavedCots(){
  if(!confirm('¿Borrar todas las cotizaciones guardadas? (no afecta los PDFs ya impresos)'))return;
  localStorage.removeItem('mlSavedCots');
  refreshSavedCotDropdown();
  showToast('✓ Lista de cotizaciones borrada');
}

// Adjunto: solo se guarda el nombre/tamaño como referencia visible
function handleRecAttachment(input){
  var info=document.getElementById('rec-attachment-info');
  if(input.files&&input.files[0]){
    var f=input.files[0];
    var sizeKB=Math.round(f.size/1024);
    REC.attachment={name:f.name,size:sizeKB};
    info.textContent='📎 Adjunto: '+f.name+' ('+sizeKB+' KB) — se referenciará en el recibo (el archivo no se incrusta).';
    info.classList.remove('hidden');
  } else {
    REC.attachment=null;
    info.classList.add('hidden');
  }
}

// Etiquetas de método de pago
function payMethodLabel(p){
  return p==='efectivo'?'Efectivo':
         p==='transferencia'?'Transferencia bancaria':
         p==='mp_pos'?'TC/TD · MercadoPago en punto de venta':
         p==='mp_link'?'TC/TD · MercadoPago vía link de pago':
         'Efectivo';
}
function statusLabel(s){
  return s==='anticipo'?'Anticipo':s==='liquidacion'?'Liquidación':s==='parcial'?'Pago parcial':'Pago total';
}

// ===== GENERAR PDF DE RECIBO =====
function generateReceiptPDF(){
  if(REC.lines.length===0){showToast('⚠ Añade al menos un concepto');return;}

  var today=new Date();
  var fechaStr=String(today.getDate()).padStart(2,'0')+'/'+String(today.getMonth()+1).padStart(2,'0')+'/'+today.getFullYear();
  var fechaPagoEl=document.getElementById('rec-fecha-pago').value;

  var rd={
    fecha:fechaStr,
    fechaPago:fechaPagoEl?formatDate(fechaPagoEl):fechaStr,
    tipo:document.getElementById('rec-tipo').value||'Servicios MatrixLab',
    cliente:document.getElementById('rec-cliente').value||'—',
    tel:document.getElementById('rec-tel').value||'—',
    lugar:document.getElementById('rec-lugar').value||'—',
    cotRef:document.getElementById('rec-cot-ref').value||'',
    payMethod:REC.payMethod,
    payRef:document.getElementById('rec-pay-ref').value||'',
    status:document.getElementById('rec-status').value,
    notas:document.getElementById('rec-notas').value,
    iva:REC.iva,
    attachment:REC.attachment
  };

  var template=document.getElementById('print-template');
  template.innerHTML=buildOneReceiptPage(getRecNumStr(),REC.lines,rd);
  REC.recNum++;
  try{localStorage.setItem('mlRecNum',REC.recNum);}catch(e){/* ignore */}
  syncRecNum(getRecNumStr());
  setTimeout(function(){window.print();},150);
}

function buildOneReceiptPage(recNum,lines,rd){
  var sub=0;
  var rows='';
  lines.forEach(function(l){
    var imp=l.qty*l.unitPrice;sub+=imp;
    rows+='<tr><td>'+escH(l.desc)+'</td><td style="text-align:center">'+l.qty+'</td><td style="text-align:center">$'+l.unitPrice.toFixed(2)+'</td><td style="text-align:center">$'+Math.round(imp).toLocaleString('es-MX')+'</td></tr>';
  });
  var iva=rd.iva?sub*0.16:0;
  var total=sub+iva;
  var subHtml='<div class="pdf-sub-row"><span>SUBTOTAL</span><span>$'+Math.round(sub).toLocaleString('es-MX')+'</span></div>';
  if(rd.iva)subHtml+='<div class="pdf-sub-row"><span>IVA (16%)</span><span>$'+Math.round(iva).toLocaleString('es-MX')+'</span></div>';
  var totalLabel=rd.status==='anticipo'?'TOTAL ANTICIPO RECIBIDO':rd.status==='liquidacion'?'TOTAL LIQUIDADO':rd.status==='parcial'?'TOTAL RECIBIDO (PARCIAL)':'TOTAL RECIBIDO';
  subHtml+='<div class="pdf-total-bar" style="background:#2f9e44"><span class="t-label">▶ '+totalLabel+(rd.iva?'':' <small>(Sin IVA)</small>')+'</span><span class="t-amount">$'+Math.round(total).toLocaleString('es-MX')+'.00</span></div>';

  // Info del método de pago
  var payDetail='';
  if(rd.payMethod==='efectivo'){
    payDetail='<div class="pdf-pay-detail">Pago recibido en efectivo'+(rd.payRef?' · Folio: <strong>'+escH(rd.payRef)+'</strong>':'')+'.</div>';
  } else if(rd.payMethod==='transferencia'){
    payDetail='<div class="pdf-pay-detail">Beneficiario: <strong>Karla E Elorza</strong><br>CLABE: <strong>002441701958367188</strong> · Banco: <strong>Banamex</strong>'+(rd.payRef?'<br>Referencia / N° de operación: <strong>'+escH(rd.payRef)+'</strong>':'')+'</div>';
  } else if(rd.payMethod==='mp_pos'){
    payDetail='<div class="pdf-pay-detail">Cobro con tarjeta TC/TD vía <strong>MercadoPago</strong> en punto de venta'+(rd.payRef?' · Folio MP: <strong>'+escH(rd.payRef)+'</strong>':'')+'.</div>';
  } else if(rd.payMethod==='mp_link'){
    payDetail='<div class="pdf-pay-detail">Cobro con tarjeta TC/TD vía <strong>link de pago MercadoPago</strong>'+(rd.payRef?' · Folio MP: <strong>'+escH(rd.payRef)+'</strong>':'')+'.</div>';
  }

  var payOptionsHtml='<div class="pdf-pay-options">'
    +'<strong>Medios de pago aceptados:</strong> '
    +'💵 Efectivo &nbsp;·&nbsp; '
    +'🏦 Transferencia (Karla E Elorza · CLABE 002441701958367188 · Banamex) &nbsp;·&nbsp; '
    +'💳 TC/TD vía MercadoPago (punto de venta o link de pago)'
    +'</div>';

  // Notas / condiciones
  var condHtml='';
  if(rd.cotRef){
    condHtml+='<div class="pdf-cond-item"><span class="pdf-cond-label">✦ Cotización de origen:</span><span>'+escH(rd.cotRef)+'</span></div>';
  }
  if(rd.attachment){
    condHtml+='<div class="pdf-cond-item"><span class="pdf-cond-label">✦ Comprobante adjunto:</span><span>'+escH(rd.attachment.name)+' ('+rd.attachment.size+' KB)</span></div>';
  }
  if(rd.notas){
    rd.notas.split('\n').forEach(function(line){
      if(!line.trim())return;
      var parts=line.split(':');
      if(parts.length>=2){condHtml+='<div class="pdf-cond-item"><span class="pdf-cond-label">✦ '+escH(parts[0].trim())+':</span><span>'+escH(parts.slice(1).join(':').trim())+'</span></div>';}
      else{condHtml+='<div class="pdf-cond-item"><span>✦ '+escH(line)+'</span></div>';}
    });
  }
  condHtml+='<div class="pdf-cond-item"><span class="pdf-cond-label">✦ Validez:</span><span>Este recibo ampara únicamente los conceptos y montos detallados en esta hoja.</span></div>';
  condHtml+='<div class="pdf-cond-item"><span class="pdf-cond-label">✦ Facturación:</span><span>En caso de requerir CFDI, se añade 16% de IVA al total. Solicitar al momento del pago.</span></div>';

  var paidStamp=rd.status==='anticipo'?'ANTICIPO':rd.status==='liquidacion'?'LIQUIDADO':rd.status==='parcial'?'PARCIAL':'PAGADO';
  // Verde para pagos completados (PAGADO/LIQUIDADO), ámbar para parciales (ANTICIPO/PARCIAL)
  var stampRGB=(rd.status==='anticipo'||rd.status==='parcial')?'230,119,0':'47,158,68';
  var watermarkHtml='<div class="pdf-watermark"><div class="pdf-watermark-text" style="color:rgba('+stampRGB+',0.20);border-color:rgba('+stampRGB+',0.28)">'+paidStamp+'</div></div>';

  return '<div class="pdf-page">'
    +'<div class="pdf-green-bar" style="background:linear-gradient(90deg,#69DB7C,#63E6BE)"></div>'
    +'<div class="pdf-header" style="position:relative">'
      +'<div class="pdf-header-row">'
        +'<div>'
          +'<div class="pdf-logo-name">MatrixLab</div>'
          +'<div class="pdf-logo-sub">Papelería Creativa &amp; T-Shirt Lab &amp; Cap Lab</div>'
          +'<div class="pdf-logo-slogan">Donde tus ideas hacen click.</div>'
        +'</div>'
        +'<div class="pdf-rec-title">RECIBO DE PAGO</div>'
      +'</div>'
    +'</div>'
    +'<div class="pdf-contact-bar">'
      +'<span><strong>📷</strong> @MatrixLab.Stickers &nbsp; <strong>📱</strong> 5655575131</span>'
      +'<em>Smart tools for brilliant minds ✦</em>'
    +'</div>'
    +'<div class="pdf-body">'
      +'<div class="pdf-info-grid">'
        +'<div class="pdf-info-half">'
          +'<div class="pdf-info-header" style="background:#2f9e44"><span>🧾</span> DATOS DEL RECIBO</div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">N° de Recibo:</span><span class="pdf-info-val v-purple">'+escH(recNum)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Fecha de pago:</span><span class="pdf-info-val">'+escH(rd.fechaPago)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Cot. de origen:</span><span class="pdf-info-val v-purple">'+escH(rd.cotRef||'—')+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Tipo de servicio:</span><span class="pdf-info-val">'+escH(rd.tipo)+'</span></div>'
        +'</div>'
        +'<div class="pdf-info-half" style="border-left:1px solid #dee2e6">'
          +'<div class="pdf-info-header alt"><span>👤</span> DATOS DEL CLIENTE</div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Cliente / Evento:</span><span class="pdf-info-val v-green">'+escH(rd.cliente)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Teléfono / Email:</span><span class="pdf-info-val">'+escH(rd.tel)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Lugar / Dirección:</span><span class="pdf-info-val">'+escH(rd.lugar)+'</span></div>'
          +'<div class="pdf-info-row"><span class="pdf-info-label">Estatus:</span><span class="pdf-info-val v-green">'+escH(statusLabel(rd.status))+'</span></div>'
        +'</div>'
      +'</div>'
      +'<div class="pdf-section-hd" style="background:#2f9e44"><span>✏</span> DETALLE DEL PAGO</div>'
      +'<div class="pdf-detail-wrap">'
      +'<table class="pdf-table"><thead><tr>'
        +'<th style="background:#69DB7C;color:#1a1a2e">Concepto</th><th style="background:#69DB7C;color:#1a1a2e">Cant.</th><th style="background:#69DB7C;color:#1a1a2e">P. Unit.</th><th style="background:#69DB7C;color:#1a1a2e">Importe</th>'
      +'</tr></thead><tbody>'+rows+'</tbody></table>'
      +subHtml
      +watermarkHtml
      +'</div>'
      +'<div class="pdf-pay-grid">'
        +'<div class="pdf-pay-header"><span>💳</span> FORMA DE PAGO</div>'
        +'<div class="pdf-pay-body">'
          +'<div class="pdf-pay-method">'+escH(payMethodLabel(rd.payMethod))+'</div>'
          +payDetail
        +'</div>'
        +payOptionsHtml
      +'</div>'
      +'<div class="pdf-conditions"><div class="pdf-section-hd" style="border-radius:0;background:#2f9e44"><span>📌</span> CONDICIONES DEL RECIBO</div><div class="pdf-cond-body">'+condHtml+'</div></div>'
    +'</div>'
    +'<div class="pdf-footer-bar">'
      +'<div class="fl">MatrixLab Stickers · <span style="color:#69DB7C">Recibo de pago oficial</span></div>'
      +'<div class="fr"><strong>📷 @MatrixLab.Stickers</strong> &nbsp; 📱 WA: 5655575131 &nbsp; ✦ Smart tools for brilliant minds</div>'
    +'</div>'
    +'<div class="pdf-green-bar" style="background:linear-gradient(90deg,#69DB7C,#63E6BE)"></div>'
  +'</div>';
}


// ===== IMANES PERSONALIZADOS =====
function setImnPrint(t,el){
  SIMN.printType=t;
  el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});
  el.classList.add('active');
  document.getElementById('imn-adhesivo-opts').classList.toggle('hidden',t!=='vinil_adhesivo');
  document.getElementById('imn-corte-opts').classList.toggle('hidden',t!=='vinil_corte');
  calcIMN();
}
function setImnMat(m,el){SIMN.mat=m;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcIMN();}
function setImnLam(l,el){SIMN.lam=l;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcIMN();}
function setImnCorte(t,el){
  SIMN.corteType=t;
  el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});
  el.classList.add('active');
  document.getElementById('imn-corte-custom-opts').classList.toggle('hidden',t!=='custom');
  calcIMN();
}
function setImnAcabado(t,el){
  SIMN.acabado=t;
  el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});
  el.classList.add('active');
  document.getElementById('imn-resina-opts').classList.toggle('hidden',t!=='resina');
  calcIMN();
}
function changeImnQty(d){var el=document.getElementById('qty-imn');var v=Math.max(1,parseInt(el.value||'1')+d);el.value=v;calcIMN();}
function calcIMN(){
  SIMN.w=parseFloat(document.getElementById('imn-w').value)||5;
  SIMN.h=parseFloat(document.getElementById('imn-h').value)||5;
  SIMN.qty=Math.max(1,parseInt(document.getElementById('qty-imn').value)||1);
  SIMN.margen=parseInt(document.getElementById('margen-imn').value);
  SIMN.diseno=document.getElementById('chk-imn-diseno').checked;
  SIMN.disFee=parseFloat(document.getElementById('imn-dis-fee').value)||0;

  var area=SIMN.w*SIMN.h; // cm² por pieza

  // Costo base magnética
  var magArea=C.rolloMagW*C.rolloMagL;
  var magPerCm2=C.rolloMagPrice/Math.max(1,magArea);
  var magCost=magPerCm2*area;

  // Costo impresión
  var printCost=0;var printLabel='';
  if(SIMN.printType==='vinil_adhesivo'){
    var m=MATS[SIMN.mat];
    var sheetArea=m.w*m.h;
    var matPerCm2=C[m.cKey]/Math.max(1,sheetArea);
    printCost=matPerCm2*area;
    printLabel=m.label;
    var A4a=21.0*29.7;
    if(SIMN.lam==='liso'){printCost+=(C.lamLiso/A4a)*area;printLabel+=' + lam liso';}
    else if(SIMN.lam==='tex'){printCost+=(C.lamTex/A4a)*area;printLabel+=' + lam tex';}
  } else {
    var vcP,vcW,vcL,vcLabel;
    if(SIMN.corteType==='holoA'){vcP=C.vcorteHoloAPrice;vcW=C.vcorteHoloAW;vcL=C.vcorteHoloAL;vcLabel='Holo premium (30×120cm)';}
    else if(SIMN.corteType==='holoB'){vcP=C.vcorteHoloBPrice;vcW=C.vcorteHoloBW;vcL=C.vcorteHoloBL;vcLabel='Holo económico (30cm×10m)';}
    else{
      vcP=C.vcorteCustomPrice;
      vcW=C.vcorteCustomW;
      vcL=C.vcorteCustomL;
      vcLabel='Vinil corte personalizado';
    }
    var vcArea=vcW*vcL;
    var vcPerCm2=vcP/Math.max(1,vcArea);
    printCost=vcPerCm2*area;
    printLabel='Vinil corte: '+vcLabel;
  }

  // Acabado adicional (resina)
  var acabadoCost=SIMN.acabado==='resina'?C.resinaPerPieza:0;

  // Fee diseño
  var feeDis=SIMN.diseno?SIMN.disFee:0;

  var costoVarUnit=magCost+printCost+acabadoCost;
  var costoTotal=costoVarUnit*SIMN.qty+feeDis;
  var costoUnit=costoTotal/SIMN.qty;
  var precioUnit=costoUnit/(1-SIMN.margen/100);
  var precioTotal=precioUnit*SIMN.qty;

  var desc='Imán personalizado '+SIMN.w+'×'+SIMN.h+'cm — '+printLabel+(acabadoCost>0?' + resina 3D':'')+(SIMN.diseno?' + diseño':'')+ ' (todo incluido)';
  PRICES.imanes={desc:desc,qty:SIMN.qty,unitPrice:precioUnit};

  document.getElementById('res-imanes').innerHTML=
    resCard('Base magnética/pza','$'+magCost.toFixed(2),SIMN.w+'×'+SIMN.h+'cm · cal 20')+
    resCard('Impresión/pza','$'+printCost.toFixed(2),printLabel)+
    (acabadoCost>0?resCard('Resina 3D/pza','$'+acabadoCost.toFixed(2),'Epoxy por pieza'):'')+
    resCard('Costo material/pza','$'+costoVarUnit.toFixed(2),'')+
    resCard('Diseño amortizado','$'+(feeDis/SIMN.qty).toFixed(2),feeDis>0?'Fee $'+feeDis.toFixed(0)+' en '+SIMN.qty+' pzas':'No incluido')+
    resCard('Precio sugerido/pza',fmt(precioUnit),'Margen '+SIMN.margen+'%',true)+
    resCard('Total ×'+SIMN.qty,fmtK(precioTotal),'')+
    resCard('Ganancia estimada',fmtK(precioTotal-costoTotal),'');
}

// ===== ACCESORIOS — TAGS Y LLAVEROS =====
function setAccSub(sub,el){
  document.querySelectorAll('#page-accesorios .sub-tab').forEach(function(b){b.classList.remove('active-purple','active-cyan')});
  el.classList.add('active-purple');
  document.getElementById('sub-acc-tagllavero').classList.toggle('active',sub==='tagllavero');
  document.getElementById('sub-acc-vasos').classList.toggle('active',sub==='vasos');
}
function setAccTLTipo(t,el){SACC_TL.tipo=t;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcACCTag();}
function changeAccTLQty(d){var el=document.getElementById('qty-acc-tl');var v=Math.max(1,parseInt(el.value||'1')+d);el.value=v;calcACCTag();}
function toggleAccFoto(){
  var c=document.getElementById('chk-acc-foto').checked;
  document.getElementById('acc-foto-opts').classList.toggle('hidden',!c);
  calcACCTag();
}

function calcACCTag(){
  SACC_TL.qty=Math.max(1,parseInt(document.getElementById('qty-acc-tl').value)||1);
  SACC_TL.margen=parseInt(document.getElementById('margen-acc-tl').value);
  SACC_TL.dtfW=parseFloat(document.getElementById('acc-dtf-w').value)||0;
  SACC_TL.dtfH=parseFloat(document.getElementById('acc-dtf-h').value)||0;
  SACC_TL.doubleDTF=document.getElementById('chk-acc-double-dtf').checked;
  SACC_TL.useFoto=document.getElementById('chk-acc-foto').checked;
  SACC_TL.fotoArea=parseFloat(document.getElementById('acc-foto-area').value)||0;
  SACC_TL.useCorte=document.getElementById('chk-acc-corte').checked;
  SACC_TL.corteCosto=C.accCorteCosto;
  SACC_TL.diseno=document.getElementById('chk-acc-tl-diseno').checked;
  SACC_TL.disFee=parseFloat(document.getElementById('acc-tl-dis-fee').value)||0;

  // Base
  var baseCost,tipoLabel;
  if(SACC_TL.tipo==='llavero'){baseCost=C.llavero;tipoLabel='Llavero acrílico figura';}
  else if(SACC_TL.tipo==='tag_rect'){baseCost=C.tagRect;tipoLabel='Tag rectangular';}
  else{baseCost=C.tagRedondo;tipoLabel='Tag redondo';}

  // DTF UV
  var dtfArea=SACC_TL.dtfW*SACC_TL.dtfH;
  var dtfLienzoArea=C.dtfUVW*C.dtfUVL;
  var dtfPerCm2=C.dtfUVPrice/Math.max(1,dtfLienzoArea);
  var dtfSides=SACC_TL.doubleDTF?2:1;
  var dtfCost=dtfArea*dtfPerCm2*dtfSides;

  // Papel fotográfico
  var fotoSheetArea=21.6*27.9;
  var fotoCost=SACC_TL.useFoto&&SACC_TL.fotoArea>0?(C.foto/fotoSheetArea)*SACC_TL.fotoArea:0;

  // Vinil de corte (costo directo por pieza ingresado)
  var corteCost=SACC_TL.useCorte?SACC_TL.corteCosto:0;

  // Fee diseño
  var feeDis=SACC_TL.diseno?SACC_TL.disFee:0;

  var costoVarUnit=baseCost+dtfCost+fotoCost+corteCost;
  var costoTotal=costoVarUnit*SACC_TL.qty+feeDis;
  var costoUnit=costoTotal/SACC_TL.qty;
  var precioUnit=costoUnit/(1-SACC_TL.margen/100);
  var precioTotal=precioUnit*SACC_TL.qty;

  var decParts=[];
  if(dtfArea>0)decParts.push('DTF UV '+SACC_TL.dtfW+'×'+SACC_TL.dtfH+'cm'+(SACC_TL.doubleDTF?' ambas caras':''));
  if(SACC_TL.useFoto&&SACC_TL.fotoArea>0)decParts.push('papel fotográfico');
  if(SACC_TL.useCorte)decParts.push('vinil de corte');
  var desc=tipoLabel+' personalizado'+(decParts.length>0?' — '+decParts.join(' + '):'')+(SACC_TL.diseno?' + diseño':'')+' (todo incluido)';
  PRICES.accTagLlavero={desc:desc,qty:SACC_TL.qty,unitPrice:precioUnit};

  document.getElementById('res-acc-tl').innerHTML=
    resCard('Base/pza','$'+baseCost.toFixed(2),tipoLabel)+
    (dtfArea>0?resCard('DTF UV/pza','$'+dtfCost.toFixed(2),dtfArea.toFixed(1)+'cm²'+(dtfSides>1?' ×2 caras':'')):'')+
    (fotoCost>0?resCard('Papel foto/pza','$'+fotoCost.toFixed(2),SACC_TL.fotoArea+'cm²'):'')+
    (corteCost>0?resCard('Vinil corte/pza','$'+corteCost.toFixed(2),'Costo por pieza'):'')+
    resCard('Costo material/pza','$'+costoVarUnit.toFixed(2),'')+
    resCard('Diseño amortizado','$'+(feeDis/SACC_TL.qty).toFixed(2),feeDis>0?'Fee $'+feeDis.toFixed(0)+' en '+SACC_TL.qty+' pzas':'No incluido')+
    resCard('Precio sugerido/pza',fmt(precioUnit),'Margen '+SACC_TL.margen+'%',true)+
    resCard('Total ×'+SACC_TL.qty,fmtK(precioTotal),'')+
    resCard('Ganancia estimada',fmtK(precioTotal-costoTotal),'');
}

// ===== ACCESORIOS — VASOS =====
function setAccVasoTipo(t,el){SACC_V.tipo=t;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calcACCVasos();}
function changeAccVasosQty(d){var el=document.getElementById('qty-acc-vasos');var v=Math.max(1,parseInt(el.value||'1')+d);el.value=v;calcACCVasos();}
function getVasoCost(t){
  var m={mason16color:C.vasoMason16Color,mason16trans:C.vasoMason16Trans,infantil10:C.vasoInfantil10,tumbler24trans:C.tumbler24Trans,vidrio16asa:C.vidrio16Asa,tumbler24color:C.tumbler24Color,vasoLata:C.vasoLata};
  return m[t]||0;
}
function getVasoLabel(t){
  var m={mason16color:'Mason jar 16oz tapa color',mason16trans:'Mason jar 16oz transparente',infantil10:'Vaso infantil 10oz',tumbler24trans:'Tumbler 24oz transparente',vidrio16asa:'Vidrio 16oz con asa',tumbler24color:'Tumbler 24oz tapa color',vasoLata:'Vaso lata de vidrio'};
  return m[t]||t;
}
function calcACCVasos(){
  SACC_V.qty=Math.max(1,parseInt(document.getElementById('qty-acc-vasos').value)||1);
  SACC_V.margen=parseInt(document.getElementById('margen-acc-vasos').value);
  SACC_V.mlAgua=parseFloat(document.getElementById('acc-v-agua').value)||0;
  SACC_V.mlGlicerina=parseFloat(document.getElementById('acc-v-glicerina').value)||0;
  SACC_V.mlAceite=parseFloat(document.getElementById('acc-v-aceite').value)||0;
  SACC_V.mlColor=parseFloat(document.getElementById('acc-v-color').value)||0;
  SACC_V.gGlitter=parseFloat(document.getElementById('acc-v-glitter').value)||0;
  SACC_V.gMica=parseFloat(document.getElementById('acc-v-mica').value)||0;
  SACC_V.mlBaseAlcohol=parseFloat(document.getElementById('acc-v-base-alcohol').value)||0;
  SACC_V.mlBaseAceite=parseFloat(document.getElementById('acc-v-base-aceite').value)||0;
  SACC_V.mlAcrilico=parseFloat(document.getElementById('acc-v-acrilico').value)||0;
  SACC_V.dtfW=parseFloat(document.getElementById('acc-v-dtf-w').value)||0;
  SACC_V.dtfH=parseFloat(document.getElementById('acc-v-dtf-h').value)||0;
  SACC_V.diseno=document.getElementById('chk-acc-v-diseno').checked;
  SACC_V.disFee=parseFloat(document.getElementById('acc-v-dis-fee').value)||0;

  var vasoCost=getVasoCost(SACC_V.tipo);
  var vasoLabel=getVasoLabel(SACC_V.tipo);

  // Liquidos (costo interno)
  var costoAgua=(SACC_V.mlAgua/1000)*C.aguaDestL;
  var costoGlicerina=(SACC_V.mlGlicerina/1000)*C.glicerinaL;
  var costoAceite=(SACC_V.mlAceite/1000)*C.aceiteMineralL;
  var costoColor=SACC_V.mlColor*C.colorComMl;
  var costoGlitter=SACC_V.gGlitter*(C.glitter60g/60);
  var costoMica=SACC_V.gMica*(C.mica810g/810);
  var costoBaseAlcohol=SACC_V.mlBaseAlcohol*C.colorBaseAlcohol;
  var costoBaseAceite=SACC_V.mlBaseAceite*C.colorBaseAceite;
  var costoAcrilico=SACC_V.mlAcrilico*C.colorAcrilico;
  var costoLiq=costoAgua+costoGlicerina+costoAceite+costoColor+costoGlitter+costoMica+costoBaseAlcohol+costoBaseAceite+costoAcrilico;

  // DTF UV
  var dtfArea=SACC_V.dtfW*SACC_V.dtfH;
  var dtfLienzoArea=C.dtfUVW*C.dtfUVL;
  var dtfCost=dtfArea>0?(C.dtfUVPrice/Math.max(1,dtfLienzoArea))*dtfArea:0;

  // Fee diseño
  var feeDis=SACC_V.diseno?SACC_V.disFee:0;

  var costoVarUnit=vasoCost+costoLiq+dtfCost;
  var costoTotal=costoVarUnit*SACC_V.qty+feeDis;
  var costoUnit=costoTotal/SACC_V.qty;
  var precioUnit=costoUnit/(1-SACC_V.margen/100);
  var precioTotal=precioUnit*SACC_V.qty;

  var dtfLabel=dtfArea>0?' — DTF UV '+SACC_V.dtfW+'×'+SACC_V.dtfH+'cm':'';
  PRICES.accVasos={
    desc:vasoLabel+' personalizado'+dtfLabel+(SACC_V.diseno?' + diseño':'')+' (todo incluido)',
    qty:SACC_V.qty,unitPrice:precioUnit
  };

  // Desglose liquidos para display interno
  var liqParts=[];
  if(SACC_V.mlAgua>0)liqParts.push(SACC_V.mlAgua+'ml agua');
  if(SACC_V.mlGlicerina>0)liqParts.push(SACC_V.mlGlicerina+'ml glicerina');
  if(SACC_V.mlAceite>0)liqParts.push(SACC_V.mlAceite+'ml aceite');
  if(SACC_V.mlColor>0)liqParts.push(SACC_V.mlColor+'ml color');
  if(SACC_V.gGlitter>0)liqParts.push(SACC_V.gGlitter+'g glitter');
  if(SACC_V.gMica>0)liqParts.push(SACC_V.gMica+'g mica');
  if(SACC_V.mlBaseAlcohol>0)liqParts.push(SACC_V.mlBaseAlcohol+'ml base alcohol');
  if(SACC_V.mlBaseAceite>0)liqParts.push(SACC_V.mlBaseAceite+'ml base aceite');
  if(SACC_V.mlAcrilico>0)liqParts.push(SACC_V.mlAcrilico+'ml acrílico');
  var liqNote=liqParts.length>0?liqParts.join(' · '):'Sin relleno líquido';

  document.getElementById('res-acc-vasos').innerHTML=
    resCard('Vaso/pza','$'+vasoCost.toFixed(2),vasoLabel)+
    (costoLiq>0?resCard('Relleno (interno)/pza','$'+costoLiq.toFixed(2),liqNote):'')+
    (dtfCost>0?resCard('DTF UV/pza','$'+dtfCost.toFixed(2),dtfArea.toFixed(1)+'cm² aplicados'):'')+
    resCard('Costo total/pza','$'+costoVarUnit.toFixed(2),'')+
    resCard('Diseño amortizado','$'+(feeDis/SACC_V.qty).toFixed(2),feeDis>0?'Fee $'+feeDis.toFixed(0)+' en '+SACC_V.qty+' pzas':'No incluido')+
    resCard('Precio sugerido/pza',fmt(precioUnit),'Margen '+SACC_V.margen+'%',true)+
    resCard('Total ×'+SACC_V.qty,fmtK(precioTotal),'')+
    resCard('Ganancia estimada',fmtK(precioTotal-costoTotal),'');
}

// ===== LÁSER / 3D — NAVEGACIÓN =====
function setFabSub(sub,el){
  document.querySelectorAll('#page-fablab .sub-tab').forEach(function(b){b.classList.remove('active-cyan','active-purple')});
  el.classList.add('active-cyan');
  document.getElementById('sub-fab-laser').classList.toggle('active',sub==='laser');
  document.getElementById('sub-fab-3d').classList.toggle('active',sub==='print3d');
}

// ===== GRABADO / CORTE LÁSER =====
function changeLaserQty(d){var el=document.getElementById('qty-laser');var v=Math.max(1,parseInt(el.value||'1')+d);el.value=v;calcLaser();}
function toggleLaserInsumo(){
  var c=document.getElementById('chk-laser-insumo').checked;
  document.getElementById('laser-insumo-opts').classList.toggle('hidden',!c);
  document.getElementById('laser-insumo-cliente-note').style.display=c?'none':'block';
  calcLaser();
}
function calcLaser(){
  SLAS.min=Math.max(0,parseFloat(document.getElementById('laser-min').value)||0);
  SLAS.rate=parseFloat(document.getElementById('laser-rate').value)||0;
  SLAS.useInsumo=document.getElementById('chk-laser-insumo').checked;
  SLAS.insumoNombre=document.getElementById('laser-insumo-nombre').value||'Artículo';
  SLAS.insumoCosto=parseFloat(document.getElementById('laser-insumo-costo').value)||0;
  SLAS.consumible=parseFloat(document.getElementById('laser-consumible').value)||0;
  SLAS.qty=Math.max(1,parseInt(document.getElementById('qty-laser').value)||1);
  SLAS.setup=document.getElementById('chk-laser-setup').checked;
  SLAS.setupFee=parseFloat(document.getElementById('laser-setup').value)||0;
  SLAS.margen=parseInt(document.getElementById('margen-laser').value);

  var tiempoCost=SLAS.min*SLAS.rate;                 // costo de máquina por pieza
  var insumoCost=SLAS.useInsumo?SLAS.insumoCosto:0;  // artículo a grabar (inline)
  var consumCost=SLAS.consumible;                    // spray de marcado, etc.
  var feeSetup=SLAS.setup?SLAS.setupFee:0;

  var costoVarUnit=tiempoCost+insumoCost+consumCost;
  var costoTotal=costoVarUnit*SLAS.qty+feeSetup;
  var costoUnit=costoTotal/SLAS.qty;
  var precioUnit=costoUnit/(1-SLAS.margen/100);
  var precioTotal=precioUnit*SLAS.qty;

  var artLabel=SLAS.useInsumo?'Grabado láser sobre '+SLAS.insumoNombre:'Grabado láser sobre artículo del cliente';
  PRICES.laser={
    desc:artLabel+(consumCost>0?' (con marcado)':'')+(SLAS.setup?' + preparación':'')+' (todo incluido)',
    qty:SLAS.qty,unitPrice:precioUnit
  };

  document.getElementById('res-laser').innerHTML=
    resCard('Tiempo máquina/pza','$'+tiempoCost.toFixed(2),SLAS.min+' min × $'+SLAS.rate.toFixed(2))+
    (insumoCost>0?resCard('Artículo/pza','$'+insumoCost.toFixed(2),SLAS.insumoNombre):'')+
    (consumCost>0?resCard('Consumible/pza','$'+consumCost.toFixed(2),'Spray / masking'):'')+
    resCard('Costo total/pza','$'+costoVarUnit.toFixed(2),'')+
    resCard('Preparación amortizada','$'+(feeSetup/SLAS.qty).toFixed(2),feeSetup>0?'Fee $'+feeSetup.toFixed(0)+' en '+SLAS.qty+' pzas':'No incluido')+
    resCard('Precio sugerido/pza',fmt(precioUnit),'Margen '+SLAS.margen+'%',true)+
    resCard('Total ×'+SLAS.qty,fmtK(precioTotal),'')+
    resCard('Ganancia estimada',fmtK(precioTotal-costoTotal),'');
  document.getElementById('laser-note').textContent=
    (SLAS.useInsumo?'Incluye el '+SLAS.insumoNombre+' ($'+SLAS.insumoCosto.toFixed(2)+'/pza). ':'Servicio de grabado sobre artículo del cliente. ')+
    SLAS.min+' min de láser × $'+SLAS.rate.toFixed(2)+'/min = $'+tiempoCost.toFixed(2)+'/pza de máquina. '+
    (feeSetup>0?'Fee de preparación $'+feeSetup.toFixed(0)+' amortizado. ':'')+'CFDI +16% IVA.';
}

// ===== IMPRESIÓN 3D =====
function set3DFil(f,el){S3D.fil=f;el.closest('.chip-group').querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});el.classList.add('active');calc3D();}
function change3DQty(d){var el=document.getElementById('qty-p3d');var v=Math.max(1,parseInt(el.value||'1')+d);el.value=v;calc3D();}
function get3DFil(f){
  var m={pla:{c:C.filPla,l:'PLA básico'},plaSeda:{c:C.filPlaSeda,l:'PLA seda/mate'},petg:{c:C.filPetg,l:'PETG'},abs:{c:C.filAbs,l:'ABS/ASA'},tpu:{c:C.filTpu,l:'TPU flexible'}};
  return m[f]||m.pla;
}
function calc3D(){
  S3D.fil=S3D.fil||'pla';
  S3D.gramos=Math.max(0,parseFloat(document.getElementById('p3d-gramos').value)||0);
  S3D.horas=Math.max(0,parseFloat(document.getElementById('p3d-horas').value)||0);
  S3D.post=parseFloat(document.getElementById('p3d-post').value)||0;
  S3D.qty=Math.max(1,parseInt(document.getElementById('qty-p3d').value)||1);
  S3D.setup=document.getElementById('chk-p3d-setup').checked;
  S3D.setupFee=parseFloat(document.getElementById('p3d-setup').value)||0;
  S3D.margen=parseInt(document.getElementById('margen-p3d').value);

  document.getElementById('p3d-merma-lbl').textContent=C.print3dMerma+'%';

  var fil=get3DFil(S3D.fil);
  var merma=1+(C.print3dMerma/100);
  var matCost=(S3D.gramos/1000)*fil.c*merma;     // filamento + merma por pieza
  var tiempoCost=S3D.horas*C.print3dRate;        // máquina por pieza
  var postCost=S3D.post;                         // post-proceso por pieza
  var feeSetup=S3D.setup?S3D.setupFee:0;

  var costoVarUnit=matCost+tiempoCost+postCost;
  var costoTotal=costoVarUnit*S3D.qty+feeSetup;
  var costoUnit=costoTotal/S3D.qty;
  var precioUnit=costoUnit/(1-S3D.margen/100);
  var precioTotal=precioUnit*S3D.qty;

  PRICES.print3d={
    desc:'Pieza impresa en 3D — '+fil.l+' ('+S3D.gramos+'g · '+S3D.horas+'h)'+(S3D.setup?' + modelado':'')+' (todo incluido)',
    qty:S3D.qty,unitPrice:precioUnit
  };

  document.getElementById('res-p3d').innerHTML=
    resCard('Filamento/pza','$'+matCost.toFixed(2),S3D.gramos+'g '+fil.l+' +'+C.print3dMerma+'% merma')+
    resCard('Máquina/pza','$'+tiempoCost.toFixed(2),S3D.horas+'h × $'+C.print3dRate.toFixed(2)+'/h')+
    (postCost>0?resCard('Post-proceso/pza','$'+postCost.toFixed(2),'Acabado'):'')+
    resCard('Costo total/pza','$'+costoVarUnit.toFixed(2),'')+
    resCard('Modelado amortizado','$'+(feeSetup/S3D.qty).toFixed(2),feeSetup>0?'Fee $'+feeSetup.toFixed(0)+' en '+S3D.qty+' pzas':'No incluido')+
    resCard('Precio sugerido/pza',fmt(precioUnit),'Margen '+S3D.margen+'%',true)+
    resCard('Total ×'+S3D.qty,fmtK(precioTotal),'')+
    resCard('Ganancia estimada',fmtK(precioTotal-costoTotal),'');
  document.getElementById('p3d-note').textContent=
    S3D.gramos+'g de '+fil.l+' (+'+C.print3dMerma+'% merma) + '+S3D.horas+'h × $'+C.print3dRate.toFixed(2)+'/h. '+
    (feeSetup>0?'Fee de modelado $'+feeSetup.toFixed(0)+' amortizado. ':'')+'CFDI +16% IVA.';
}

// ===== COSTOS =====
function updateCosts(){
  C.pvc=parseFloat(document.getElementById('c-pvc').value)||0;
  C.pp=parseFloat(document.getElementById('c-pp').value)||0;
  C.lunchera=parseFloat(document.getElementById('c-lunchera').value)||0;
  C.empaqueD=parseFloat(document.getElementById('c-empaque-d').value)||0;
  C.lp=parseFloat(document.getElementById('c-lp').value)||0;
  C.lm=parseFloat(document.getElementById('c-lm').value)||1;
  C.lcm=parseFloat(document.getElementById('c-lcm').value)||0;
  C.opal=parseFloat(document.getElementById('c-opal').value)||0;
  C.foto=parseFloat(document.getElementById('c-foto').value)||0;
  C.vb=parseFloat(document.getElementById('c-vb').value)||0;
  C.vt=parseFloat(document.getElementById('c-vt').value)||0;
  C.tattoo=parseFloat(document.getElementById('c-tattoo').value)||0;
  C.disFee=parseFloat(document.getElementById('c-diseno-fee').value)||0;
  C.atom100=parseFloat(document.getElementById('c-atom100').value)||0;
  C.esponja=parseFloat(document.getElementById('c-esponja').value)||0;
  C.atom30=parseFloat(document.getElementById('c-atom30').value)||0;
  C.celofan=parseFloat(document.getElementById('c-celofan').value)||0;
  C.holoLiso=parseFloat(document.getElementById('c-holo-liso').value)||0;
  C.holoTex=parseFloat(document.getElementById('c-holo-tex').value)||0;
  C.glow=parseFloat(document.getElementById('c-glow').value)||0;
  C.mag=parseFloat(document.getElementById('c-mag').value)||0;
  C.lamLiso=parseFloat(document.getElementById('c-lam-liso').value)||0;
  C.lamTex=parseFloat(document.getElementById('c-lam-tex').value)||0;
  C.stkDisFee=parseFloat(document.getElementById('c-stk-dis').value)||0;
  C.inf=parseFloat(document.getElementById('c-inf').value)||0;
  C.adu=parseFloat(document.getElementById('c-adu').value)||0;
  C.tote=parseFloat(document.getElementById('c-tote').value)||0;
  C.tallaEsp=parseFloat(document.getElementById('c-talla-esp').value)||0;
  C.lienzo=parseFloat(document.getElementById('c-lienzo').value)||350;
  C.lienzoArea=parseFloat(document.getElementById('c-lienzo-area').value)||9000;
  C.empaqueP=parseFloat(document.getElementById('c-empaque-p').value)||0;
  C.gorraC=parseFloat(document.getElementById('c-gorra-c').value)||28;
  C.gorraK=parseFloat(document.getElementById('c-gorra-k').value)||35;
  C.parcheEco=parseFloat(document.getElementById('c-parche-eco').value)||15;
  C.parchePremium=parseFloat(document.getElementById('c-parche-premium').value)||50;
  // Imanes
  C.rolloMagPrice=parseFloat(document.getElementById('c-rollo-mag-price').value)||1348;
  C.rolloMagW=parseFloat(document.getElementById('c-rollo-mag-w').value)||61;
  C.rolloMagL=parseFloat(document.getElementById('c-rollo-mag-l').value)||1500;
  C.vcorteHoloAPrice=parseFloat(document.getElementById('c-vcorte-holoa-price').value)||240;
  C.vcorteHoloAW=parseFloat(document.getElementById('c-vcorte-holoa-w').value)||30;
  C.vcorteHoloAL=parseFloat(document.getElementById('c-vcorte-holoa-l').value)||120;
  C.vcorteHoloBPrice=parseFloat(document.getElementById('c-vcorte-holob-price').value)||225;
  C.vcorteHoloBW=parseFloat(document.getElementById('c-vcorte-holob-w').value)||30;
  C.vcorteHoloBL=parseFloat(document.getElementById('c-vcorte-holob-l').value)||1000;
  C.vcorteCustomPrice=parseFloat(document.getElementById('c-vcorte-custom-price').value)||200;
  C.vcorteCustomW=parseFloat(document.getElementById('c-vcorte-custom-w').value)||30;
  C.vcorteCustomL=parseFloat(document.getElementById('c-vcorte-custom-l').value)||100;
  C.resinaPerPieza=parseFloat(document.getElementById('c-resina-pza').value)||0;
  // Accesorios - llaveros y tags
  C.llavero=parseFloat(document.getElementById('c-llavero').value)||55;
  C.tagRect=parseFloat(document.getElementById('c-tag-rect').value)||11.35;
  C.tagRedondo=parseFloat(document.getElementById('c-tag-redondo').value)||9.45;
  C.accCorteCosto=parseFloat(document.getElementById('c-acc-corte-pza').value)||0;
  // Vasos
  C.vasoMason16Color=parseFloat(document.getElementById('c-vaso-mason16color').value)||88.75;
  C.vasoMason16Trans=parseFloat(document.getElementById('c-vaso-mason16trans').value)||82.60;
  C.vasoInfantil10=parseFloat(document.getElementById('c-vaso-infantil10').value)||86.07;
  C.tumbler24Trans=parseFloat(document.getElementById('c-vaso-tumbler24trans').value)||99.01;
  C.vidrio16Asa=parseFloat(document.getElementById('c-vaso-vidrio16asa').value)||125.34;
  C.tumbler24Color=parseFloat(document.getElementById('c-vaso-tumbler24color').value)||95.47;
  C.vasoLata=parseFloat(document.getElementById('c-vaso-lata').value)||53.33;
  // Liquidos
  C.aguaDestL=parseFloat(document.getElementById('c-agua-dest').value)||27;
  C.glicerinaL=parseFloat(document.getElementById('c-glicerina').value)||197;
  C.aceiteMineralL=parseFloat(document.getElementById('c-aceite-min').value)||96.90;
  C.colorComMl=parseFloat(document.getElementById('c-color-com').value)||1.30;
  C.glitter60g=parseFloat(document.getElementById('c-glitter').value)||180;
  C.mica810g=parseFloat(document.getElementById('c-mica').value)||912.68;
  C.colorBaseAlcohol=parseFloat(document.getElementById('c-color-base-alcohol').value)||0;
  C.colorBaseAceite=parseFloat(document.getElementById('c-color-base-aceite').value)||0;
  C.colorAcrilico=parseFloat(document.getElementById('c-color-acrilico').value)||0;
  // DTF UV
  C.dtfUVPrice=parseFloat(document.getElementById('c-dtf-uv-price').value)||450;
  C.dtfUVW=parseFloat(document.getElementById('c-dtf-uv-w').value)||38;
  C.dtfUVL=parseFloat(document.getElementById('c-dtf-uv-l').value)||100;
  // Láser / 3D
  C.laserRate=parseFloat(document.getElementById('c-laser-rate').value)||5;
  C.laserSetup=parseFloat(document.getElementById('c-laser-setup').value)||80;
  C.filPla=parseFloat(document.getElementById('c-fil-pla').value)||420;
  C.filPlaSeda=parseFloat(document.getElementById('c-fil-pla-seda').value)||520;
  C.filPetg=parseFloat(document.getElementById('c-fil-petg').value)||480;
  C.filAbs=parseFloat(document.getElementById('c-fil-abs').value)||540;
  C.filTpu=parseFloat(document.getElementById('c-fil-tpu').value)||650;
  C.print3dRate=parseFloat(document.getElementById('c-3d-rate').value)||12;
  C.print3dMerma=parseFloat(document.getElementById('c-3d-merma').value)||0;
  C.print3dSetup=parseFloat(document.getElementById('c-3d-setup').value)||80;
  // Actualizar labels de precio/cm²
  var magCm2=(C.rolloMagPrice/(C.rolloMagW*C.rolloMagL)).toFixed(4);
  document.getElementById('c-rollo-mag-cm2').textContent='$'+magCm2;
  var dtfCm2=(C.dtfUVPrice/(C.dtfUVW*C.dtfUVL)).toFixed(4);
  document.getElementById('c-dtf-uv-cm2').textContent='$'+dtfCm2;
  calcD();calcTStation();calcTKit();calcTS();calcCL();calcP();calcStk();calcIMN();calcACCTag();calcACCVasos();calcLaser();calc3D();
}

// ===== TOAST =====
function showToast(msg){var t=document.getElementById('toast-msg');t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2200);}

// ===== INIT =====
try{
  var savedNum=localStorage.getItem('mlCotNum');
  if(savedNum)COT.cotNum=parseInt(savedNum)||3;
  var savedRecNum=localStorage.getItem('mlRecNum');
  if(savedRecNum)REC.recNum=parseInt(savedRecNum)||1;
}catch(e){/* localStorage may be blocked; defaults will be used */}
syncRecNum(getRecNumStr());
calcD();calcTStation();calcTKit();calcTS();calcCL();calcP();calcStk();calcIMN();calcACCTag();calcACCVasos();calcLaser();calc3D();
// Set today date
(function(){var d=new Date();document.getElementById('cot-fecha-evento').valueAsDate=d;document.getElementById('rec-fecha-pago').valueAsDate=d;})();
