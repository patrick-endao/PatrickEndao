$(document).ready(function () {
    handleFormSubmission();
});

function handleFormSubmission() {
    $('#benchmarkConfigurationForm').submit(function (event) {
        event.preventDefault();
        var formValues = getFormValues();
        var benchmarkParameters = unpackSerializedArray(formValues);
        launchBenchmark(benchmarkParameters);
    });
}

function getFormValues() {
    return $('#benchmarkConfigurationForm').serializeArray();
}

function unpackSerializedArray(array) {
    var unpackedObject = {};
    for (i = 0; i < array.length; i++) {
        var key = array[i].name;
        var value = array[i].value;
        unpackedObject[key] = value;
    }
    return unpackedObject;
}

function launchBenchmark(benchmarkParameters) {
    switchActiveTab('#log');
    var benchmark = new Benchmark(benchmarkParameters);
    logger = benchmark.logger;
    logger.logMessage('Launching Benchmark');
    benchmark.runTests();
    logger.logMessage('Finished Benchmark');
    results = benchmark.getResults();
    logger.logMessage(JSON.stringify(results));
}

var Benchmark = function (benchmarkParameters) {
    this.RADIX = 10;
    this.parameters = benchmarkParameters;
    this.logger = new Logger();
    this.scheduler = new AjaxScheduler();
    this.benchmarkResults = new BenchmarkResultsReport();
    this.numberOfObjects = parseInt(this.parameters.objNum, this.RADIX);
    this.numberOfQueries = parseInt(this.parameters.objQueries, this.RADIX);
    this.objectIndex = 0;

    this.runTests = function () {
        this.runCachelessTests();
        this.runCacheTests();
    };

    this.runCachelessTests = function () {
        for (i = 0; i < this.numberOfObjects; i++) {
            this.objectIndex = i;
            this.logger.logMessage('Running queries for object #' + String(i + 1));
            var ajaxRequest = this.packageRequest();
            this.scheduler.scheduleAjaxCalls(ajaxRequest, this.numberOfQueries, this.benchmarkResults);
        }
    };

    this.packageRequest = function () {
        var minimumObjectDepth = parseInt(this.parameters.minDepth, this.RADIX);
        var maximumObjectDepth = parseInt(this.parameters.maxDepth, this.RADIX);
        var minimumObjectScope = parseInt(this.parameters.minScope, this.RADIX);
        var maximumObjectScope = parseInt(this.parameters.maxScope, this.RADIX);
        request = {
            objIndex: this.objectIndex,
            minObjDepth: minimumObjectDepth,
            maxObjDepth: maximumObjectDepth,
            minObjScope: minimumObjectScope,
            maxObjScope: maximumObjectScope
        };
        return request;
    };

    this.recordQueryResults = function (response, elapsedTime) {
        report = this.benchmarkResults;
        report.insertServerObject(this.objectIndex, response);
        report.insertServerResultRecord(elapsedTime);
        report.incrementSucceeded();
    };

    this.runCacheTests = function () {

    };

    this.getResults = function () {
        return this.benchmarkResults;
    };
};

var BenchmarkResultsReport = function(){
    this.serverResults = [];
    this.cacheResults = [];
    this.serverObjects = {};
    this.cacheObjects = {};
    this.succeededCalls = 0;
    this.failedCalls = 0;

    this.insertServerResultRecord = function (result) {
        this.serverResults.push(result);
    };

    this.insertCacheResultRecord = function(result){
        this.cacheResults.push(result);
    };

    this.insertServerObject = function (objectIndex, serverObject) {
        this.serverObjects[objectIndex] = serverObject;
    };

    this.insertCacheObject = function (objectIndex, serverObject) {
        this.cacheObjects[objectIndex] = serverObject;
    };

    this.getServerResults = function () {
        return this.serverResults;
    };

    this.getCacheResults = function () {
        return this.cacheResults;
    };

    this.incrementSucceeded = function () {
        this.succededCalls++;
    };

    this.incrementFailed = function () {
        this.failedCalls++;
    };

    this.isReady = function () {

    }
};

var AjaxScheduler = function () {

    this.scheduleAjaxCalls = function (packagedRequest, numberOfQueries, benchmarkResults) {
        this.packagedRequest = packagedRequest;
        this.queriesRemaining = numberOfQueries;
        this.results = benchmarkResults;
        this.elapsedQueryTimes = [];
        this.serverResponses = [];
        var scheduler = this;
        this.sendAjaxCall(scheduler);
    };

    this.sendAjaxCall = function (scheduler) {
        scheduler.queriesRemaining -= 1;
        var remainder = scheduler.queriesRemaining;
        var timer = new Timer();
        timer.start();
        $.ajax({
            url: "/Home/GenerateTestObject",
            type: "GET",
            data: scheduler.packagedRequest,
            dataType: "json",
            success: function (response) {
                timer.stop();
                elapsedTime = timer.getTotal();
                console.warn(String(elapsedTime));
                scheduler.recordQueryResults(response, elapsedTime);
                if (scheduler.queriesRemaining > 0) {
                    setTimeout(scheduler.sendAjaxCall(scheduler), 100);
                }
            },
            error: function (error) {
                console.warn('Error' + JSON.stringify(error));
            }
        });
    };

    this.recordQueryResults = function (response, elapsedTime) {
        this.elapsedQueryTimes.push(elapsedTime);
        this.serverResponses.push(response);
    };
}

var Timer = function(){
    this.startTime = 0;
    this.endTime = 0;
    this.elapsedTime = 0;

    this.start = function () {
        this.startTime = new Date();
    };

    this.stop = function () {
        this.endTime = new Date();
    };

    this.getTotal = function () {
        this.elapsedTime = this.endTime - this.startTime;
        return this.elapsedTime;
    };
};

var Logger = function () {
    this.console = document.getElementById('logConsole');

    this.logMessage = function (message) {
        this.console.innerHTML = this.console.innerHTML + '<br>' + message;
    };
};

function switchActiveTab(tabClass) {
    $('.nav-pills a[href="' + tabClass + '"]').tab('show');
}