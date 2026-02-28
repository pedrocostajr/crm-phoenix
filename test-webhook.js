const testWebhook = async () => {
    const url = 'https://phoenix-crm-flame.vercel.app/api/webhook'; // Verifique se este é o seu domínio Vercel
    const payload = {
        id: "lead-test-manual",
        data: {
            name: "MANUAL TEST",
            email: "test@manual.com",
            phone: "54996895454",
            "block-test": "Teste de funcionamento"
        },
        status: "NEW",
        createdAt: new Date().toISOString()
    };

    console.log('Enviando teste para:', url);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('Resposta do Servidor:', result);
    } catch (error) {
        console.error('Erro no fetch:', error);
    }
};

testWebhook();
