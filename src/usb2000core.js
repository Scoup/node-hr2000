/**
 * USB2000Data is used to receive and convert the data of spectros
 * All Spectometer specifications can be found on Oceanoptics site
 * @link http://www.oceanoptics.com/technical/engineering/OEM%20Data%20Sheet%20--%20USB2000+.pdf
 */
var utilBytes = require('./utilBytes')

function USB2000Data(callback) {
	var self = this
	this.errorTimeout = 5000
	this.totalFrames = 9
	this.output = []
	this.callback = callback ? callback : function() {};
	this.counter = 0
	this.model = 'hr4000'
	this.timeout = setTimeout(function(){
		var error = "Timeout on request " + self.errorTimeout + "ms"
		self.callback(error, null)
	}, this.errorTimeout)
}

/**
 * Clear cache
 */
USB2000Data.prototype.clear = function() {
	this.output = []
	this.counter = 0
}

/**
 * Add data to cache
 * All calls is asynchronous and the data has to be merged
 */
USB2000Data.prototype.addData = function(data) {
	var self = this
	this.counter++
	if(this.counter === this.totalFrames){
		//this last data is the checksum
		//@todo test the checksum!
		clearTimeout(this.timeout)
		this.callback(null, self.getData())
	} else {
		data = this.convertData(data)
		this.output.concat(data)
	}
}

/**
 * Return the data output
 */
USB2000Data.prototype.getData = function() {
	return this.output
}

/**
 * Convert the data to output
 *
 */
USB2000Data.prototype.convertData = function(data) {
	var size = data.length
	var output = []
	if(size == 1) return
	for(var i = 0; i < size; i+=2) {
		var lsb = data[i]
		var msb = data[i+1]
		if(this.model === 'hr2000+') {
			msb = msb ^ 0x20 //bit 13 flipped (only hr2000+)	
		}
		var original =  utilBytes.zeroFill(lsb.toString(2) + msb.toString(2));

		var lsb = utilBytes.zeroFill(lsb.toString(2), 8)
		var msb = utilBytes.zeroFill(msb.toString(2), 8)

		var pixel = msb + lsb;
		pixel = utilBytes.zeroFill(pixel, 16)
		output.push(parseInt(pixel,2))
	}
	this.output = this.output.concat(output)
	return output
}

USB2000Data.prototype.reverseBits = function(num, numBits) {
	var reversedNum
	var mask = 0

	mask = (0x1 << (numBits/2)) -1
	if(numBits === 1) return num
	reversedNum = this.reverse(num >> numBits / 2, numBits / 2) | this.reverse((num & mask), numBits/2) << numBits/2;
	return reversedNum
}

module.exports = USB2000Data