import express from "express";





const app = express();

//add middleware


app.use(express.json());


app.post("/run-test", async (req, res) => {



    try{

        const config = req.body;

        const result = await runLoadTest(config);

        res.json(result);


    }catch(error){

        console.error(error);

        res.status(500).json({
            error: "Failed to run load test"
        })

    }



    

});

app.listen(4001, () => {
    console.log("Worker running in port 5001");
})



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

type LoadTestConfig = {
    url: string;
    method: HttpMethod;
    users: number;
    durationMs: number;

}


type HttpMethod = "GET";



type LoadTestResult = {

    overallUsers: number;
    totalSuccessfulRequests: number;
    totalFailedRequests: number;
    averageLatency: number;
    totalRequests: number;
    durationMs: number;
    secondsDuration: number;
    requestsPerSecond: number;
    p50: number;
    p95: number;
    p99: number;

}

const runLoadTest = async (config: LoadTestConfig) : Promise<LoadTestResult> => {



    let totalSuccessfulRequests = 0;
    let totalFailedRequests = 0;
    let totalLatency = 0;
    let totalRequests = 0;
    const overallLatencies: number[] = [];



    const { url, method, durationMs, users  } = config;

    const virtualUsers: Promise<VirtualUserResult>[] = [];

    const startTime = performance.now()
    for (let i = 0; i < users; i++) {
        const result = runVirtualUser(durationMs, url, method);
        virtualUsers.push(result);
    }
    const results = await Promise.all(virtualUsers);
    const endTime = performance.now();
    const secondsDuration = (endTime - startTime) / 1000;


    results.forEach(virtUser => {

        totalSuccessfulRequests += virtUser.successfulRequests;
        totalFailedRequests += virtUser.failedRequests;
        totalLatency += virtUser.totalLatency;
        totalRequests += virtUser.totalRequests;
        overallLatencies.push(...virtUser.latencies);

    });

    const sortedLatencies = overallLatencies.sort((a,b) => a - b);

    const p50 = calculatePercentile(sortedLatencies, 0.50);
    const p95 = calculatePercentile(sortedLatencies, 0.95);
    const p99 = calculatePercentile(sortedLatencies, 0.99);

    return { 
        overallUsers: users,
        totalSuccessfulRequests,
        totalFailedRequests,
        averageLatency: totalRequests > 0 ? (totalLatency / totalRequests) : 0,
        totalRequests,
        durationMs: endTime - startTime,
        secondsDuration,
        requestsPerSecond: secondsDuration > 0 ? (totalRequests / secondsDuration) : 0,
        p50,
        p95,
        p99
    }
}






const runVirtualUser = async (durationMs: number, url: string, method: HttpMethod): Promise<VirtualUserResult> => {


    const latencies: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;
    let latencySum = 0;
    let totalRequests = 0;

    const endTime = performance.now() + durationMs;

    while(performance.now() < endTime){
        const result = await makeRequest(url, method);
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






const makeRequest = async (url: string, method: HttpMethod): Promise<RequestResult> => {
    const startTime = performance.now();

    try {
        const response = await fetch(url,{
            method
        });

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







const calculatePercentile = (sortedLatencies: number[], percentile: number): number => {


    const latenciesLength = sortedLatencies.length;
    if(latenciesLength === 0){
        return 0;
    }

    if(percentile > 1 || percentile <= 0){
        throw new Error("Invalid percentile");
    }


    const rank = Math.ceil(latenciesLength * percentile);

    const index = rank - 1;


    return sortedLatencies[index]!;

    

}






// console.log(await runLoadTest({ url: "http://localhost:5000", method: "GET", users: 5, durationMs: 5000 }));



