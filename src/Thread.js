var Thread = (function() {
    
    /**
     * a template function used to construct the webworker's content
     */
    var Template = function() {
        self.onmessage = function(e) {
            var msg = e.data;
            var params = [];
            
            if(msg.type === 'exec') {
                try {
                    var result = (THREAD_HANDLE).apply(self, msg.data);
                    self.postMessage({
                        type: 'result',
                        data: result
                    });
                } catch(ex) {
                    self.postMessage({
                        type: 'error',
                        data: ex
                    });
                }
                
            }
        };
        
    };
    
    /**
     * Helper class that will run a function in a separate thread by using webworkers
     * @constructor
     * @param {Function} handle
     */
    var Thread = function(handle) {
        this.handle = "(" + Template.toString().replace('THREAD_HANDLE', handle.toString()) + ")();";
        this.url = null;
        this.worker = null;
        this.promise = null;
        this.deferred = null;
    };
    
    /**
     * Execute the function
     * @param {Array} params function arguments
     * @returns {Promise}
     */
    Thread.prototype.exec = function(params) {
        params = params || [];
        
        this.promise = new Promise(function(resolve, reject) {
            this.deferred = {
                resolve: resolve,
                reject: reject
            };
        }.bind(this));
        
        this.worker.postMessage({
            type: 'exec',
            data: this.params
        });
        
        this.worker.onmessage = function(e) {
            var msg = e.data;
            switch (msg.type) {
                case 'result':
                    this.deferred.resolve(msg.data);
                    break;
                
                case 'error':
                    this.deferred.reject(msg.data);
                    break;
            }
                
        }.bind(this);
        
        return this.promise;
    };
    
    /**
     * Start the thread. Creates a new webworker
     */
    Thread.prototype.start = function() {
        if(this.worker !== null) {
            this.terminate();    
        }
        
        this.url = window.URL.createObjectURL(new Blob([this.handle.toString()]));
        this.worker = new Worker(this.url);
        
        return this;
    };
    
    /**
     * terminates the thread and worker
     */
    Thread.prototype.terminate = function() {
        this.worker.terminate();
        window.URL.revokeObjectURL(this.url);
        
        this.worker = null;
        this.url = null;
        this.deferred.reject('Terminated');
        return this;
    };
    
    return Thread;
}());