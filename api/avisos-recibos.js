import admin from 'firebase-admin';

// Inicializar Firebase Admin
if (!admin.apps.length) {
    try {
        let serviceAccount;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Error inicializando Firebase Admin:', error);
    }
}

export default async function handler(req, res) {
    // Vercel Cron envía un GET. También permitimos POST por si queremos probarlo manualmente.
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const db = admin.firestore();
        
        // 1. Obtener el Token del Admin
        const adminDoc = await db.collection('configuracion').doc('admin_push').get();
        if (!adminDoc.exists || !adminDoc.data().token) {
            return res.status(400).json({ success: false, error: 'No hay token de admin configurado.' });
        }
        const tokenAdmin = adminDoc.data().token;

        // 2. Obtener la Configuración de los días de aviso
        const configDoc = await db.collection('configuracion').doc('recibos_config').get();
        let diasAviso = [2, 1, 0]; // Por defecto
        if (configDoc.exists && configDoc.data().avisoDias) {
            diasAviso = configDoc.data().avisoDias;
        }

        // 3. Obtener los Recibos
        const recibosDoc = await db.collection('configuracion').doc('recibos_admin').get();
        if (!recibosDoc.exists || !recibosDoc.data().recibos) {
            return res.status(200).json({ success: true, message: 'No hay recibos para revisar.' });
        }
        const recibos = recibosDoc.data().recibos;

        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        let notificacionesEnviadas = 0;

        // 4. Revisar cada recibo
        for (const recibo of recibos) {
            // Ignorar si ya está pagado
            const abonado = (recibo.abonos || []).reduce((a, b) => a + (Number(b.monto) || 0), 0);
            const saldo = (Number(recibo.montoTotal) || 0) - abonado;
            if (saldo <= 0.009) continue;

            if (!recibo.fechaVencimiento) continue;

            const [y, m, d] = recibo.fechaVencimiento.split('-').map(Number);
            const fechaVenc = new Date(y, m-1, d);
            fechaVenc.setHours(0,0,0,0);

            const diffTime = fechaVenc - hoy;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            // Si el día de hoy coincide con los días de aviso configurados
            if (diasAviso.includes(diffDays)) {
                let textDays = '';
                if (diffDays === 0) textDays = 'HOY';
                else if (diffDays === 1) textDays = 'MAÑANA';
                else textDays = `en ${diffDays} días`;

                const mensaje = {
                    notification: {
                        title: `🔔 Recibo por vencer: ${recibo.nombre}`,
                        body: `El recibo ${recibo.numero} (${recibo.concepto}) vence ${textDays}. Saldo pendiente: $${saldo.toFixed(2)}`
                    },
                    token: tokenAdmin
                };

                await admin.messaging().send(mensaje);
                notificacionesEnviadas++;
            }
        }

        return res.status(200).json({ success: true, message: `Notificaciones enviadas: ${notificacionesEnviadas}` });

    } catch (error) {
        console.error('Error en cron de recibos:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
