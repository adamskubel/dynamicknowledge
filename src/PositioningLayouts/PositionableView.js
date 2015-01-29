define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Modifier   = require("famous/core/Modifier");
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');

	function PositionableView(options) 
	{
		View.apply(this, arguments);

		this.size = this.options.size;		
		this.position = this.options.position;

	    this.viewAlign = [0,0];
	    this.viewOrigin = [0,0];				

		this.isAnimated = PositionableView.DEFAULT_OPTIONS.isAnimated;
		this.positionTransition =  PositionableView.DEFAULT_OPTIONS.positionTransition;
		this.sizeTransition =  PositionableView.DEFAULT_OPTIONS.sizeTransition;

		this.positionState = new Transitionable(Transform.translate(this.position[0],this.position[1],this.position[2]));
		this.sizeState = new Transitionable(this.size);
	}

	PositionableView.prototype = Object.create(View.prototype);	
	PositionableView.prototype.constructor = PositionableView;



	PositionableView.DEFAULT_OPTIONS = 
	{
        // size: [80,80],
        // position: [0,0,0],
        isAnimated: true,
        positionTransition: {duration:200, curve: Easing.outQuad},
        sizeTransition: {duration:200, curve: Easing.outQuad}
    };


	PositionableView.prototype.calculateSize = function() {
		return this.size;
	};	    

	PositionableView.prototype.calculatePosition = function(){
		return this.position;
	};

	PositionableView.prototype.calculateChildPosition = function(){
		return this.calculatePosition();
	};

	PositionableView.prototype.calculateChildSize = function(){
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
				},
				// align: function() {
				// 	return view.viewAlign;
				// },
				origin: function() {
					return view.viewOrigin;
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
		this.size = newSize;
		this.sizeState.set(newSize, (this.isAnimated) ? this.sizeTransation : null);
	};

	module.exports = PositionableView;
});	