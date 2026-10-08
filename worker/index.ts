type RequestResult = {
    success: boolean;
    responseTime: number;
    status: number | null;
};


const makeRequest = async (): Promise<RequestResult> => {
    const startTime = performance.now();

    try {
        const response = await fetch("http://localhost:5000");

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        console.log(`Response time: ${responseTime} ms`);
        console.log(`HTTP Status: ${response.status}`);

        return {
            success: response.ok,
            responseTime,
            status: response.status
        };

    } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        console.error(`Error making request: ${error}`);

        return {
            success: false,
            responseTime,
            status: null
        };
    }
};


const runConcurrentRequests = async () => {

    let count = 5

    let totalLatency = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    const requestPromises = [];

    for (let i = 0; i < count; i++) {
        requestPromises.push(makeRequest());
    }


    const results = await Promise.all(requestPromises);


    results.forEach((req) => {

        if (req.success){
            successfulRequests++;
        }else{
            failedRequests++;
        }

        totalLatency += req.responseTime;
        


    });

    console.log(`Total Requests: ${count}`);    
    console.log(`Successful Requests: ${successfulRequests}`);
    console.log(`Failed Requests: ${failedRequests}`);
    console.log(`Average Latency: ${count > 0 ? (totalLatency / count).toFixed(2) : 0} ms`);

}


const runVirtualUser = async (durationMs: number) => {

    const endTime = performance.now() + durationMs;

    while(performance.now() < endTime){
       await makeRequest();
    }

}






runVirtualUser(5000); 