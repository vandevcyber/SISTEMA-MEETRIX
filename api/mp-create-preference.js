// Cria uma "preferência" de pagamento no Mercado Pago Checkout Pro.
// Essa página já vem pronta com Pix, cartão de crédito e boleto — sem precisar
// implementar cada método na mão.
import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { valor, descricao, emailPagador, externalReference, origin } = req.body;
  if (!valor || valor <= 0) return res.status(400).json({ error: "Valor inválido" });

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [{
          title: descricao || "Exportação de leads - Meetrix",
          quantity: 1,
          unit_price: Number(valor),
          currency_id: "BRL",
        }],
        payer: { email: emailPagador || undefined },
        external_reference: externalReference,
        back_urls: {
          success: `${origin}/?mp_status=approved&mp_ref=${externalReference}`,
          failure: `${origin}/?mp_status=failure&mp_ref=${externalReference}`,
          pending: `${origin}/?mp_status=pending&mp_ref=${externalReference}`,
        },
        auto_return: "approved",
      },
    });

    return res.status(200).json({ init_point: result.init_point, preference_id: result.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar preferência de pagamento", details: err.message });
  }
}
