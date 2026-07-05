// Verifica se já existe um pagamento aprovado para uma determinada referência
// (a referência é gerada por nós no momento da exportação, antes do redirecionamento).
import { MercadoPagoConfig, Payment } from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido" });

  const { ref } = req.query;
  if (!ref) return res.status(400).json({ error: "Referência é obrigatória" });

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = new Payment(client);
    const result = await payment.search({ options: { external_reference: ref } });
    const found = result.results?.[0];
    if (!found) return res.status(200).json({ status: "not_found" });
    return res.status(200).json({ status: found.status, id: found.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao consultar pagamento" });
  }
}
