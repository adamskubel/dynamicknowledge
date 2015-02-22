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

        if (wrapSurface)
        {
            this.setWrapSurface(wrapSurface);
        }

        this.size = this.options.size;
	}

    SurfaceWrappingView.DEFAULT_OPTIONS = {
        size:[true,true]
    };

	SurfaceWrappingView.prototype = Object.create(PositionableView.prototype);
	SurfaceWrappingView.prototype.constructor = SurfaceWrappingView;


	SurfaceWrappingView.prototype.setWrapSurface = function(wrapSurface){
        this.wrapSurface = wrapSurface;
        this.add(wrapSurface);
	};

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

	SurfaceWrappingView.prototype.setAnimated = function(isAnimated) {
		this.isAnimated = isAnimated;
	};

	SurfaceWrappingView.prototype.getSize = function(){
		var surfaceSize = this.wrapSurface._size;


        var size;
        if (this.size)
            size = [this.size[0],this.size[1]];
        else
        {
            size = [undefined, undefined];
            this.size = [undefined,undefined];
        }

        if (surfaceSize)
        {
            if (this.size[0] == true)
                size[0] = surfaceSize[0];
            if (this.size[1] == true)
                size[1] = surfaceSize[1];
        }

        //if (!size)
        //console.debug(this._globalId + " _ surfaceSize = " + surfaceSize);
		return size;
	};

    function _getMinimumSize(){

        var surfaceSize = this.wrapSurface._size;
        var size = [this.size[0],this.size[1]];
        if (surfaceSize)
        {
            if (this.size[0] == true || this.size[0] == undefined)
                size[0] = surfaceSize[0];
            if (this.size[1] == true || this.size[1] == undefined)
                size[1] = surfaceSize[1];
        }
        //console.log(this._globalId + " _ minSize = " + size);
        return size;
    }


    SurfaceWrappingView.prototype.measure = function(requestedSize){
		return {
			minimumSize: (this.options.minimumSize) ? this.options.minimumSize : this.getSize(), //_getMinimumSize.call(this),
			maximumSize: (this.options.maximumSize) ? this.options.maximumSize : this.getSize()
		};
	};

    SurfaceWrappingView.prototype.layout = function(layoutSize){
        //console.debug(this._globalId + " _ layoutSize = " + layoutSize);
        PositionableView.prototype.layout.call(this,layoutSize);
        if (this.wrapSurface._size)
    		this._layoutDirty = false;
    };

    SurfaceWrappingView.prototype.needsLayout = function(){
        if (this._layoutDirty  || this.wrapSurface._sizeDirty || this.wrapSurface._contentDirty)
        {
            return true;
        } else if (this.size[0] == true)
        {
            return ((this.wrapSurface._size && this._size) && (this._size[0] != this.wrapSurface._size[0]));
        }
        else if (this.size[1] == true)
        {
            return ((this.wrapSurface._size && this._size) &&  (this._size[1] != this.wrapSurface._size[1]));
        }
    };

    module.exports = SurfaceWrappingView;
});





























