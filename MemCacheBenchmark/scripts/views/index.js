$(document).ready(function () {
    handleFormSubmission();
})

function handleFormSubmission() {
    $('#benchmarkConfigurationForm').submit(function (event) {
        event.preventDefault();
        var formValues = getFormValues();
        var benchmarkParameters = unpackSerializedArray(formValues);
        launchBenchmark(benchmarkParameters);
        switchToLog();
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
    this.numberOfObjects = parseInt(benchmarkParameters.objNum);
    this.numberOfQueries = parseInt(benchmarkParameters.objQueries);
    this.minimumObjectDepth = parseInt(benchmarkParameters.minDepth);
    this.maximumObjectDepth = parseInt(benchmarkParameters.maxDepth);
    this.minimumObjectScope = parseInt(benchmarkParameters.minScope);
    this.maximumObjectScope = parseInt(benchmarkParameters.maxScope);
    this.benchmarkResults = new BenchmarkResultsReport();
    this.timer = new Timer();
    this.logger = new Logger();
    this.objectIndex = 0;

    this.runTests = function(){
        this.runCachelessTests();
        this.runCacheTests();
    }

    this.runCachelessTests = function () {
        for (i = 0; i < this.numberOfObjects; i++) {
            this.objectIndex = i;
            this.logger.logMessage('Running queries for object #' + String(i+1));
            this.runQueriesForObject();
        }
    }

    this.runQueriesForObject = function () {
        for (j = 0; j < this.numberOfQueries; j++) {
            this.queryServer();
        }
    }

    this.queryServer = function () {
        this.timer.start();
        this.sendGetRequest();
        this.timer.stop();
        var elapsedTime = this.timer.getTotal();
        this.benchmarkResults.insertServerResultRecord(elapsedTime);
    }

    this.sendGetRequest = function () {
        $.ajax({
            url:"/Home/GenerateTestObject",
            type: "GET",
            data: this.packageRequest(),
            dataType: "json",
            success: function (response) {
                this.logger.logMessage(JSON.stringify(response));
            },
            error: function (error) {
                alert(JSON.stringify(error));
            }
        })
    }

    this.packageRequest = function () {
        request = { objIndex : this.objectIndex,
                    minObjDepth : this.minimumObjectDepth,
                    maxObjDepth : this.maximumObjectDepth,
                    minObjScope : this.minimumObjectScope,
                    maxObjScope: this.maximumObjectScope }
        return request;
    }

    this.runCacheTests = function () {

    }

    this.getResults = function(){
        return this.benchmarkResults;
    }
};

var BenchmarkResultsReport = function(){
    this.serverResults = [];
    this.cacheResults = [];
    this.serverObjects = {};
    this.cacheObjects = {};

    this.insertServerResultRecord = function (result) {
        this.serverResults.push(result);
    };

    this.insertCacheResultRecord = function(result){
        this.cacheResults.push(result);
    };

    this.getServerResults = function(){
        return this.serverResults
    }

    this.getCacheResults = function(){
        return this.cacheResults
    }
};

var Timer = function(){
    this.startTime = 0;
    this.endTime = 0;
    this.elapsedTime = 0;

    this.start = function(){
        this.startTime = new Date();
    }

    this.stop = function(){
        this.endTime = new Date();    
    }

    this.getTotal = function(){
        this.elapsedTime = this.endTime - this.startTime;
        return this.elapsedTime;
    }
};

var Logger = function () {
    this.console = document.getElementById('logConsole');

    this.logMessage = function (message) {
        this.console.innerHTML = this.console.innerHTML + '<br>' + message;
    };
}

function switchActiveTab(tabClass) {
    $('.nav-pills a[href="' + tabClass + '"]').tab('show');
}