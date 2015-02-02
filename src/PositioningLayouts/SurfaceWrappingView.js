define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var PositionableView = require('./PositionableView');

	function SurfaceWrappingView(wrapSurface, options)
	{
		PositionableView.call(this, options);

		this.wrapSurface = wrapSurface;
		this.add(wrapSurface);
	}

	SurfaceWrappingView.prototype = Object.create(PositionableView.prototype);
	SurfaceWrappingView.prototype.constructor = SurfaceWrappingView;


	SurfaceWrappingView.DEFAULT_OPTIONS = 
	{
        size: [0,0],
        position: [0,0,0],
        isAnimated: true,
        positionTransition: {duration:250, curve: Easing.outQuad},
        sizeTransition: {duration:250, curve: Easing.outQuad}
    };

	//SurfaceWrappingView.prototype.setWrappedSurface = function(surface){
	//	this.wrapSurface = surface;
	//	this.add(surface);
	//};

	SurfaceWrappingView.prototype.addSurface = function(surface){
		this.add(surface);
	};

	SurfaceWrappingView.prototype.calculateSize = function() {
		if (this.owner)
			return this.owner.calculateChildSize(this);
		return this.getSize();
	};	    

	SurfaceWrappingView.prototype.calculatePosition = function(){
		if (this.owner)
			return this.owner.calculateChildPosition(this);
		return this.position;
	};

	SurfaceWrappingView.prototype.setAnimated = function(isAnimated) {
		this.isAnimated = isAnimated;
	};

	SurfaceWrappingView.prototype.setSize = function(newSize) {
		this.sizeState.set(newSize, (this.isAnimated && this.size) ? this.sizeTransition : null);
		this.size = newSize;
	};

	SurfaceWrappingView.prototype.getSize = function(){
		var surfaceSize = this.wrapSurface._size;
		console.log("Surface size = " + surfaceSize);
		if (surfaceSize)
			return surfaceSize;
		return this.size;
	};

    SurfaceWrappingView.prototype.measure = function(requestedSize){
		return {
			minimumSize: (this.minimumSize) ? this.minimumSize : this.getSize(),
			maximumSize: (this.maximumSize) ? this.maximumSize : this.getSize()
		};
	};

    SurfaceWrappingView.prototype.layout = function(layoutSize){
        this.setSize(layoutSize);
		this._layoutDirty = false;
    };

	module.exports = SurfaceWrappingView;
});	