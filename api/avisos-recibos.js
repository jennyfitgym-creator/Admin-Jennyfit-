import admin from 'firebase-admin';

export default async function handler(req, res) {
    try {
        // 1. Inicializar Firebase Admin con la llave secreta guardada en Vercel
        if (!admin.apps.length) {
            if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
                return res.status(500).json({ success: false, error: 'Falta configurar FIREBASE_SERVICE_ACCOUNT en Vercel' });
            }
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        const db = admin.firestore();
        
        // 2. Obtener el Token del Administrador (tu teléfono)
        const adminDoc = await db.collection('configuracion').doc('admin_push').get();
        if (!adminDoc.exists || !adminDoc.data().token) {
            return res.status(400).json({ success: false, error: 'No hay token de admin configurado en la nube.' });
        }
        const tokenAdmin = adminDoc.data().token;

        // 3. Obtener la Configuración de los días (2 días, 1 día, hoy)
        const configDoc = await db.collection('configuracion').doc('recibos_config').get();
        let diasAviso = [2, 1, 0]; // Por defecto
        if (configDoc.exists && configDoc.data().avisoDias) {
            diasAviso = configDoc.data().avisoDias;
        }

        // 4. Obtener la lista de Recibos guardados en la nube
        const recibosDoc = await db.collection('configuracion').doc('recibos_admin').get();
        if (!recibosDoc.exists || !recibosDoc.data().recibos) {
            return res.status(200).json({ success: true, message: 'No hay recibos guardados para revisar.' });
        }
        const recibos = recibosDoc.data().recibos;

        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        let notificacionesEnviadas = 0;

        // 5. Revisar recibo por recibo
        for (const recibo of recibos) {
            // Ignorar si ya está pagado
            const abonado = (recibo.abonos || []).reduce((a, b) => a + (Number(b.monto) || 0), 0);
            const saldo = (Number(recibo.montoTotal) || 0) - abonado;
            if (saldo <= 0.009) continue;

            if (!recibo.fechaVencimiento) continue;

            // Calcular cuántos días faltan para que venza
            const [y, m, d] = recibo.fechaVencimiento.split('-').map(Number);
            const fechaVenc = new Date(y, m-1, d);
            fechaVenc.setHours(0,0,0,0);

            const diffTime = fechaVenc - hoy;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            // Si coincide con los días de aviso que configuraste
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

                // Enviar la notificación al teléfono
                await admin.messaging().send(mensaje);
                notificacionesEnviadas++;
            }
        }

        return res.status(200).json({ success: true, message: `Notificaciones enviadas: ${notificacionesEnviadas}` });

    } catch (error) {
        console.error('Error en cron de recibos:', error);
        return res.status(500).json({ success: false, error: error.message || 'Error desconocido' });
    }
}
