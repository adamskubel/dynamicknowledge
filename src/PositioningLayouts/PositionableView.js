define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');

	function PositionableView(options) 
	{
		View.call(this, options);

		this.size = this.options.size;		
		this.position = this.options.position;

        this.viewAlign = (this.options.viewAlign);// ? this.options.viewAlign : [0.5,0.5];
	    //this.viewOrigin = [0.5,0.5];

		this.isAnimated = PositionableView.DEFAULT_OPTIONS.isAnimated;
		this.positionTransition =  PositionableView.DEFAULT_OPTIONS.positionTransition;
		this.sizeTransition =  PositionableView.DEFAULT_OPTIONS.sizeTransition;
		this.opacityTransition = undefined;

        this._layoutDirty = false;

        if (!this.position)
            this.position = [0,0,0];


		this.positionState = new Transitionable(Transform.translate(this.position[0],this.position[1],this.position[2]));
		this.sizeState = new Transitionable(this.size);
        this.alignState = new Transitionable(this.viewAlign);

		this.opacityState = new Transitionable(1);
	}

	PositionableView.prototype = Object.create(View.prototype);	
	PositionableView.prototype.constructor = PositionableView;



	PositionableView.DEFAULT_OPTIONS = 
	{
        size: [0,0],
        position: [0,0,0],
        isAnimated: true,
        positionTransition: {duration:250, curve: Easing.outQuad},
        sizeTransition: {duration:250, curve: Easing.outQuad}
    };


	PositionableView.prototype.calculateSize = function() {
		if (this.owner)
			return this.owner.calculateChildSize(this);
		return this.size;
	};	    

	PositionableView.prototype.calculatePosition = function(){
		if (this.owner)
			return this.owner.calculateChildPosition(this);
		return this.position;
	};

	PositionableView.prototype.calculateChildPosition = function(child){
		return this.calculatePosition();
	};

	PositionableView.prototype.calculateChildSize = function(child){
		return this.calculateSize();
	};

	PositionableView.prototype.constructor = PositionableView;

	PositionableView.prototype.getModifier = function getModifier()
	{		
		if (this.modifier == undefined)
		{
			var view = this;
			this.modifier = new Modifier({
				size : function() {
					return view.sizeState.get();
				},
				transform : function() {
					return view.positionState.get();
				}
                ,align: function() {
                    if (view.alignState)
					    return view.alignState.get();
                    else
                        return null;
				},
				origin: function() {
					if (view.viewOrigin)
						return view.viewOrigin;
				},
				opacity: function() {
					if (view.opacityState)
						return view.opacityState.get();
				}
			});
		}
		return this.modifier;
	};


	PositionableView.prototype.setAnimated = function(isAnimated) {
		this.isAnimated = isAnimated;
	};

	PositionableView.prototype.setPosition = function(position){
		this.position = position;
		this._eventOutput.emit('positionChange',{newPosition:position});
		this.positionState.set(Transform.translate(position[0],position[1],position[2]), (this.isAnimated) ? this.positionTransition : null);
	};

	PositionableView.prototype.setSize = function(newSize) {
		this.sizeState.set(newSize, (this.isAnimated && this.size) ? this.sizeTransition : null);
		this.size = newSize;
	};

    PositionableView.prototype.setAlign = function(newAlign) {
        this.alignState.set(newAlign, (this.isAnimated && this.viewAlign) ? this.positionTransition : null);
        this.viewAlign = newAlign;
    };

    PositionableView.prototype.setOrigin = function(newOrigin){
        this.viewOrigin = newOrigin;
    };

    PositionableView.prototype.setDynamicSizes = function(sizes) {
        if (sizes) {
            this.minimumSize = sizes.minimumSize;
            this.maximumSize = sizes.maximumSize;
        }
        else
        {
            this.minimumSize = undefined;
            this.maximumSize = undefined;
        }
    };

    PositionableView.prototype.measure = function(requestedSize){
		return {
			minimumSize: (this.minimumSize) ? this.minimumSize : this.size,
			maximumSize: (this.maximumSize) ? this.maximumSize : this.size
		};
	};

    PositionableView.prototype.layout = function(layoutSize){
        this.setSize(layoutSize);
		this._layoutDirty = false;
    };

    PositionableView.prototype.requestLayout = function(){
        this._layoutDirty = true;
    };

    PositionableView.prototype.needsLayout = function(){
        return this._layoutDirty;
    };

	PositionableView.prototype.setOpacity = function(opacity){
		this.opacityState.set(opacity,this.opacityTransition);
	}

	module.exports = PositionableView;
});	