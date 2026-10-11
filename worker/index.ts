type RequestResult = {
    success: boolean;
    responseTime: number;
    status: number | null;
};




type VirtualUserResult = {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalLatency: number;
    latencies: number[]
}





const makeRequest = async (): Promise<RequestResult> => {
    const startTime = performance.now();

    try {
        const response = await fetch("http://localhost:5000");

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // console.log(`Response time: ${responseTime} ms`);
        // console.log(`HTTP Status: ${response.status}`);

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


const runVirtualUser = async (durationMs: number): Promise<VirtualUserResult> => {


    let latencies: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;
    let latencySum = 0;
    let totalRequests = 0;
    let p50 = 0;

    const endTime = performance.now() + durationMs;

    while(performance.now() < endTime){
        const result = await makeRequest();
        totalRequests++;
        if(result.success){
            successfulRequests++;
        }
        else{
            failedRequests++;
        }
        latencies.push(result.responseTime);
        latencySum += result.responseTime;

    }



    //optimize further, no need to store all results, just keep counters and sum of latencies


    return { successfulRequests, failedRequests, totalRequests, totalLatency: latencySum, latencies };

    // console.log(`Total requests made: ${results.length}`);
    // console.log(`Successful requests: ${successfulRequests}`);
    // console.log(`Failed requests: ${failedRequests}`);
    // console.log(`Average latency: ${(latencySum / results.length).toFixed(2)} ms`);

}






const runVirtualUsers = async (numUsers: number, durationMs: number) => {



    let totalSuccessfulRequests = 0;
    let totalFailedRequests = 0;
    let totalLatency = 0;
    let totalRequests = 0;
    let overallLatencies: number[] = [];


    const virtualUsers: Promise<VirtualUserResult>[] = [];

    const startTime = performance.now()
    for (let i = 0; i < numUsers; i++) {
        const result = runVirtualUser(durationMs);
        virtualUsers.push(result);
    }
    const results = await Promise.all(virtualUsers);
    const endTime = performance.now();
    const secondDuration = (endTime - startTime) / 1000;


    results.forEach(virtUser => {

        totalSuccessfulRequests += virtUser.successfulRequests;
        totalFailedRequests += virtUser.failedRequests;
        totalLatency += virtUser.totalLatency;
        totalRequests += virtUser.totalRequests;
        overallLatencies.push(...virtUser.latencies);

    });

    overallLatencies.sort((a,b) => a - b);

    console.log(overallLatencies);

    console.log(`\nOverall results for ${numUsers} virtual users:`);
    console.log(`Total successful requests: ${totalSuccessfulRequests}`);
    console.log(`Total failed requests: ${totalFailedRequests}`);
    console.log(`Overall average latency: ${totalRequests > 0 ? `${(totalLatency/totalRequests).toFixed(2)} ms` : `No requests`}`);
    console.log(`Total requests made: ${totalSuccessfulRequests + totalFailedRequests}`)
    console.log(`Total duration: ${secondDuration.toFixed(2)} seconds`);
    console.log(`Requests per second: ${(totalRequests/secondDuration).toFixed(2)} req/s`);
    console.log(`p50: ${overallLatencies[Math.floor(overallLatencies.length/2)]}`)
}





















runVirtualUsers(1, 200);



