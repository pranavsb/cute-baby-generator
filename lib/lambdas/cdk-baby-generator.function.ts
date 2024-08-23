import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import OpenAI from 'openai';

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`Event: ${JSON.stringify(event)}`);
    console.log(`Context: ${JSON.stringify(context)}`);

    if (Math.random() < 0.9) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'no image for you! try again, you have a 10% chance of getting an image',
            }),
        }
    }
    let image_url = '';
    try {
        const openai = new OpenAI();
        const image = await openai.images.generate({
            prompt: 'a cute baby',
            model: 'dall-e-3',
            n: 1,
            size: '1024x1024'
        });
        image_url = image?.data[0]?.url ?? '';
    } catch (error) {
        console.log(`error calling OpenAI: ${error}`);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `sorry, we're down right now :(`,
            }),
        }
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: image_url,
        }),
    };
    
};