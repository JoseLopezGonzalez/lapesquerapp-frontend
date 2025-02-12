
export const insertProduction = async (production) => {
    const API_URL = new URL('/api/v1/productions', 'https://api.congeladosbrisamar.es').href;

   
    return await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},mode: 'no-cors',
        
        body: JSON.stringify(production)
    })
        .then(response => response.json())
        .then(data => data.production_id)
        .catch(error => {throw new Error(error)})
        .finally(() => console.log('Finalizado'));
}
