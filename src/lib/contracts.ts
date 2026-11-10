import crypto from 'crypto';

export interface ContractData {
  businessName: string;
  ownerName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  packageType: 'FOUNDER' | 'BASE' | 'PREMIUM';
  extraChannel: 'BOOKING' | 'IG_FB' | 'WHATSAPP';
  depositAmount: number;
  finalAmount: number;
  monthlyAmount: number;
}

export interface SignedContractResult {
  contractText: string;
  contractHtml: string;
  signerName: string;
  signerIp: string;
  signedAtUtc: string;
  documentHashSha256: string;
  signatureDataUrl?: string;
  includesPortfolioPermission: boolean;
  includesTestimonialPermission: boolean;
}

/**
 * Genera el texto legal exacto del contrato de Lumo HQ
 * Resguardo Legal de Luis Barbera (DBA Midland, TX)
 */
export function generateContractLegalText(data: ContractData): {
  text: string;
  html: string;
  includesPortfolioPermission: boolean;
  includesTestimonialPermission: boolean;
} {
  const isFounder = data.packageType === 'FOUNDER';
  const packageName = isFounder
    ? 'PAQUETE CLIENTE FUNDADOR (OFERTA SPRINT 1)'
    : data.packageType === 'BASE'
    ? 'PAQUETE BASE (LUMO HQ)'
    : 'PAQUETE PREMIUM (CONTRATISTAS Y SERVICIOS)';

  const extraChannelLabel =
    data.extraChannel === 'BOOKING'
      ? 'Reservas en Línea (Square Appointments / Booksy)'
      : data.extraChannel === 'IG_FB'
      ? 'Respuestas Automáticas en Instagram y Facebook (Meta Business Suite)'
      : 'WhatsApp Business Completo (Bienvenida, Ausencia, Catálogo y Respuestas)';

  const text = `CONTRATO DE SERVICIOS DIGITALES Y PRESENCIA LOCAL — LUMO HQ

FECHA: ${new Date().toISOString().split('T')[0]}
LUGAR: Midland, Texas, Estados Unidos

1. LAS PARTES
1.1 PRESTADOR DEL SERVICIO: Luis Barbera, operando bajo el nombre comercial registrado (DBA) "Lumo HQ" en el Condado de Midland, Texas, Estados Unidos (en adelante, "Lumo HQ").
1.2 CLIENTE: ${data.ownerName}, en representación de ${data.businessName}, ubicado en ${data.address}, ${data.city}, ${data.state} ${data.zipCode}, Teléfono: ${data.phone}, Correo: ${data.email} (en adelante, el "Cliente").

2. OBJETO DEL CONTRATO Y PAQUETE SELECCIONADO
El Cliente contrata a Lumo HQ para la optimización de su presencia digital local bajo la modalidad: ${packageName}.
Canal de contacto adicional elegido: ${extraChannelLabel}.

3. TÉRMINOS ECONÓMICOS Y CASCADA DE PAGO 50/50
3.1 Costo de Montaje: $${data.depositAmount + data.finalAmount} USD.
3.2 Anticipo Inicial (Día 0): $${data.depositAmount} USD, pagaderos al momento de firmar este contrato. Ningún trabajo técnico iniciará sin este anticipo acreditado.
3.3 Pago Final de Entrega (Día 5): $${data.finalAmount} USD, pagaderos únicamente cuando el Cliente revise y apruebe por escrito la entrega técnica.
3.4 Mensualidad de Mantenimiento: $${data.monthlyAmount} USD mensuales (más el impuesto sobre ventas de Texas aplicable al servicio de hosting, aprox. $6.60 USD), facturados automáticamente a través de Stripe a partir del mes siguiente a la entrega aprobada.

4. LÍNEA DE PRODUCCIÓN DE 5 DÍAS HÁBILES Y CONDICIÓN DE RECOLECCIÓN
El plazo de entrega técnica de 5 (cinco) días hábiles de Lumo HQ NO iniciará hasta que concurran dos condiciones obligatorias:
(a) Que el anticipo del 50% esté efectivamente acreditado en Stripe.
(b) Que el Checklist de Recolección de Datos del Día 1 esté completado al 100% (fotos, logotipo, horarios y confirmación de accesos). Si faltan materiales por parte del Cliente, el reloj se mantendrá en pausa y se notificará por escrito.

5. POLÍTICA "CERO CONTRASEÑAS" Y SEGURIDAD
Lumo HQ NUNCA solicitará, almacenará ni manipulará contraseñas personales o bancarias del Cliente. Todo acceso a herramientas de Google, Meta o Square se realizará estrictamente mediante invitación de usuario administrador gestionada por el propio Cliente.

6. DERECHOS DE AUTOR Y PROPIEDAD DE MATERIALES
El Cliente declara bajo protesta de decir verdad que posee todos los derechos, autorizaciones y licencias sobre las fotografías, logotipos, marcas y textos suministrados a Lumo HQ para su inclusión en Google y la página web. El Cliente mantendrá indemne a Luis Barbera y a Lumo HQ frente a cualquier reclamación de terceros relativa a derechos de imagen o propiedad intelectual.

7. CUMPLIMIENTO LEGAL ESTRICTO DE LA FTC Y LEY TCPA
7.1 COMISIÓN FEDERAL DE COMERCIO (FTC): Lumo HQ NO garantiza ni promete posicionamiento en el "primer lugar de Google", ni duplicación de volumen de ventas, ni garantiza puntuaciones o cantidad de reseñas. Toda reseña generada debe provenir de experiencias auténticas de clientes reales. Queda terminantemente prohibido comprar, fabricar o incentivar reseñas con premios o descuentos.
7.2 TELEPHONE CONSUMER PROTECTION ACT (TCPA): Queda prohibido el envío de mensajes masivos, listas de difusión frías o llamadas automatizadas no consentidas. Toda comunicación con prospectos se realizará de manera individual y personalizada.

8. LÍMITE DE RESPONSABILIDAD
La responsabilidad económica total acumulada de Luis Barbera y Lumo HQ frente al Cliente por cualquier causa derivada del presente contrato quedará estrictamente limitada a la cantidad total efectivamente abonada por el Cliente en concepto de montaje en los últimos 30 días.

9. POLÍTICA DE CANCELACIÓN DEL SERVICIO MENSUAL
El servicio de mantenimiento mensual de $${data.monthlyAmount} USD podrá ser cancelado por el Cliente en cualquier momento mediante notificación por escrito con 30 (treinta) días de antelación. A la cancelación, el dominio y los accesos completos del perfil de Google seguirán siendo propiedad exclusiva del Cliente.
${
  isFounder
    ? `\n10. CLÁUSULA ESPECIAL CLIENTE FUNDADOR (OFERTA SPRINT 1)\nEn consideración al descuento del 50% otorgado en el montaje ($250 USD en lugar del precio regular de $500 USD), el Cliente autoriza expresamente a Lumo HQ a publicar capturas del "antes y después" de su perfil y página web en el portafolio público y redes sociales de Lumo HQ, y se compromete a brindar un testimonio honesto sobre el servicio recibido al completar los primeros 30 días.`
    : ''
}

11. FIRMA ELECTRÓNICA Y VALIDEZ LEGAL
Las partes acuerdan que la firma electrónica capturada en pantalla, vinculada a la dirección IP del firmante, fecha/hora UTC y al hash criptográfico SHA-256 de este documento, constituye prueba plena y consentimiento vinculante de acuerdo con la Ley Uniforme de Transacciones Electrónicas de Texas (Uniform Electronic Transactions Act - Texas Business and Commerce Code Chapter 322).
`;

  const html = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #1B2130;">
      <h2 style="color: #1B2130; border-bottom: 2px solid #F2A33A; padding-bottom: 8px;">
        CONTRATO DE SERVICIOS DIGITALES Y PRESENCIA LOCAL — LUMO HQ
      </h2>
      <p><strong>FECHA:</strong> ${new Date().toISOString().split('T')[0]} | <strong>LUGAR:</strong> Midland, Texas, EE. UU.</p>
      
      <div style="background: #FFF7EC; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
        <strong>1. LAS PARTES:</strong><br/>
        <strong>Prestador:</strong> Luis Barbera (DBA "Lumo HQ", Midland, TX)<br/>
        <strong>Cliente:</strong> ${data.ownerName} (${data.businessName}), ${data.address}, ${data.city}, ${data.state} ${data.zipCode}<br/>
        <strong>Contacto:</strong> Tel: ${data.phone} | Correo: ${data.email}
      </div>

      <h3>2. OBJETO Y PAQUETE</h3>
      <p><strong>${packageName}</strong> con canal de contacto: <strong>${extraChannelLabel}</strong>.</p>

      <h3>3. PRECIOS Y CASCADA DE PAGO 50/50</h3>
      <p>
        • Montaje Total: <strong>$${data.depositAmount + data.finalAmount} USD</strong><br/>
        • Anticipo al Firmar (Día 0): <strong>$${data.depositAmount} USD</strong> (condición previa de inicio)<br/>
        • Pago Final al Aprobar (Día 5): <strong>$${data.finalAmount} USD</strong><br/>
        • Mantenimiento Mensual: <strong>$${data.monthlyAmount} USD/mes</strong> (+ Texas Sales Tax en hosting)
      </p>

      <h3>4. REGLA OPERATIVA DE 5 DÍAS HÁBILES</h3>
      <p>El plazo de entrega técnica de 5 días hábiles inicia una vez acreditado el anticipo del 50% Y recibido el 100% de los datos del Día 1.</p>

      <h3>5. POLÍTICA CERO CONTRASEÑAS</h3>
      <p>Lumo HQ nunca solicita ni almacena contraseñas; todo acceso es mediante invitación de administrador.</p>

      <h3>6. DERECHOS DE AUTOR</h3>
      <p>El cliente garantiza la propiedad de todas las fotos y logos suministrados.</p>

      <h3>7. CUMPLIMIENTO FTC & TCPA</h3>
      <p>Sin promesas de #1 en Google ni reseñas falsas. Cumplimiento estricto contra spam telefónico.</p>

      <h3>8. LÍMITE DE RESPONSABILIDAD</h3>
      <p>Limitado estrictamente al monto del montaje pagado en los últimos 30 días.</p>

      <h3>9. CANCELACIÓN CON 30 DÍAS DE AVISO</h3>
      <p>Cancelable con 30 días de notificación previa por escrito.</p>

      ${
        isFounder
          ? `<div style="background: #FFF2D6; padding: 10px; border-left: 4px solid #F2A33A; margin: 12px 0;">
              <strong>10. CLÁUSULA CLIENTE FUNDADOR:</strong> Autorización de "antes y después" en portafolio y testimonio honesto a cambio del precio especial de $250 USD.
             </div>`
          : ''
      }

      <p style="font-size: 11px; color: #5B6375; margin-top: 20px;">
        Firma electrónica vinculante bajo el Código de Comercio de Texas (Capítulo 322).
      </p>
    </div>
  `;

  return {
    text,
    html,
    includesPortfolioPermission: isFounder,
    includesTestimonialPermission: isFounder,
  };
}

/**
 * Calcula el Hash SHA-256 inmutable de un contrato firmado
 */
export function calculateContractSha256(
  contractText: string,
  signerName: string,
  signerIp: string,
  signedAtUtc: string
): string {
  const payload = `${contractText.trim()}__SIGNER:${signerName.trim()}__IP:${signerIp.trim()}__TIME:${signedAtUtc}`;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

