require('dotenv').config();

console.log('🔍 Verificando variáveis de ambiente:\n');
console.log('✅ OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Configurada' : '❌ Faltando');
console.log('✅ EVOLUTION_API_KEY:', process.env.EVOLUTION_API_KEY ? 'Configurada' : '❌ Faltando');
console.log('✅ WHATSAPP_PHONE_NUMBER:', process.env.WHATSAPP_PHONE_NUMBER || '❌ Faltando');
