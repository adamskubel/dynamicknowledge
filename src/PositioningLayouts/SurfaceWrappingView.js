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
        positionTransition: {duration:250, curve: Easing.inOutBounce}
        //sizeTransition: {duration:250, curve: Easing.inOutBounce}
    };

	//SurfaceWrappingView.prototype.setWrappedSurface = function(surface){
	//	this.wrapSurface = surface;
	//	this.add(surface);
	//};

	SurfaceWrappingView.prototype.addSurface = function(surface){
		this.add(surface);
	};

	SurfaceWrappingView.prototype.calculateSize = function() {
		if (this.parent)
			return this.parent.calculateChildSize(this);

        var surfaceSize = this.getSize();
        if (surfaceSize) return surfaceSize;
        return [0,0];
	};	    

	SurfaceWrappingView.prototype.calculatePosition = function(){
		if (this.parent)
			return this.parent.calculateChildPosition(this);

		return this.position;
	};

	SurfaceWrappingView.prototype.setAnimated = function(isAnimated) {
		this.isAnimated = isAnimated;
	};

	SurfaceWrappingView.prototype.setSize = function(newSize) {
        if (this.sizeState.isActive())
            this.sizeState.halt();
		this.sizeState.set(newSize, (this.isAnimated && this.size) ? this.sizeTransition : null);
		this.size = newSize;
	};

	SurfaceWrappingView.prototype.getSize = function(){
		var surfaceSize = this.wrapSurface._size;
		//console.log("Surface size = " + surfaceSize);
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
        if (this.wrapSurface._size)
    		this._layoutDirty = false;
    };

    SurfaceWrappingView.prototype.needsLayout = function(){
        return ((this.wrapSurface._size && this.size) && (this.size[0] != this.wrapSurface._size[0]))
            || this._layoutDirty || this.wrapSurface._sizeDirty || this.wrapSurface._contentDirty;
    };


    module.exports = SurfaceWrappingView;
});	