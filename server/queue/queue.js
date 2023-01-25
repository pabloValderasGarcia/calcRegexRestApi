var Queue = require('bee-queue');
var queue = new Queue('eqQueue');

var job;
var equationQueue = (equation) => {
    job = queue.createJob(equation);
    job.save();
    job.on('succeeded', (result) => {
        console.log('Received result for job ' + job.id + ': ' + result);
    });
}

queue.process(10, (job, done) => {
    console.log('Processing job ' + job.id);
    return done(null, job.data + job.data);
});

module.exports.equationQueue = equationQueue;