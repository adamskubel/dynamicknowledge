define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var TextareaSurface    = require("famous/surfaces/TextareaSurface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var FlexibleLayout = require('famous/views/FlexibleLayout');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var MemoryBlockView = require('./MemoryBlockView');
    var CanvasSurface = require('famous/surfaces/CanvasSurface');
    var PositionableView = require('./PositioningLayouts/PositionableView');
	function ObjectFactory(options) 
	{
	}

	var holoBlue = 'rgba(0,153,204,0.6)';
	var holoOrange = 'rgba(0,0,0,0)';

	function tungsten(alpha) {
		return 'rgba(255,197,143,'+ alpha + ')';
	};

	ObjectFactory.getTungstenColor = function(alpha){
		return 'rgba(255,197,143,'+ alpha + ')';	
	};



	var labelStyles = 
	{
		"base" :
		{
			"text" : {
			   	backgroundColor : 'rgba(0,0,0,0)',
			   	borderStyle : 'none',
			   	color : tungsten(1),
			   	fontFamily :'Helvetica',
			   	textAlign: 'left',
				fontSize: 'small',
			// },
			// "background" :
			// {
			   	backgroundColor : tungsten(0.1),
			   	borderColor : tungsten(0.4),
			   	borderWidth : '1px',
			   	borderStyle : 'solid',
			   	padding: '10px 10px 10px 10px',
			   	maxWidth: '400px'
			},
			"modifiers" :
			{
			   	baseOpacity: 0.8,
			   	focusedOpacity: 1
			}
		},
        "base2" :
        {
            "text" : {
                backgroundColor : 'rgba(0,0,0,0)',
                borderStyle : 'none',
                color : tungsten(1),
                fontFamily :'Helvetica',
                textAlign: 'left',
                fontSize: 'small'
            },
            "background" :
            {
                backgroundColor : tungsten(0.1),
                borderColor : tungsten(0.4),
                borderWidth : '1px',
                borderStyle : 'solid',
                padding: '10px 10px 10px 10px',
                maxWidth: '400px'
            },
            "modifiers" :
            {
                baseOpacity: 0.8,
                focusedOpacity: 1
            }
        },
		"compact" :
		{
			"text" : {
				color : tungsten(1),
				fontFamily :'Helvetica',
				textAlign: 'left',
				backgroundColor : tungsten(0.1),
				borderColor : tungsten(0.4),
				borderWidth : '1px',
                padding: '2px 2px 2px 2px',
				borderStyle : 'solid',
                fontSize: 'small'
			},
			"modifiers" :
			{
				baseOpacity: 0.4,
				focusedOpacity: 0.9
			}
		}
	};


	var propertyMap = 
	{		
		"base" : {
		   	backgroundColor : tungsten(0.3),
		   	borderColor : tungsten(0.8),
		   	borderWidth : '1px',
		   	borderStyle : 'solid',
		   	color : tungsten(1),
		   	fontFamily :'Helvetica',
		   	textAlign: 'left',
			useSpan: true,
			fontSize: 'small'
		},
		"compact" : {
			backgroundColor : tungsten(0.3),
			borderColor : tungsten(0.8),
			borderWidth : '1px',
			borderStyle : 'solid',
			color : tungsten(1),
			fontFamily :'Helvetica',
			textAlign: 'center',
			useSpan: false,
			fontSize: 'small'
		},
		"outline" : {

		   	backgroundColor : tungsten(0.0),	
		   	borderColor : tungsten(0.3),
		   	borderWidth : '1px',
		   	borderStyle : 'solid',
		   	color : tungsten(1),
		   	padding : '0px 0px 0px 0px',
		   	fontFamily :'Helvetica',
		   	textAlign: 'left',
			useSpan: true
		},		
		"blank_center" : {

		   	backgroundColor : tungsten(0.0),	
		   	borderWidth : '0px',
		   	borderStyle : 'none',
		   	color : tungsten(1),
		   	padding : '0px 0px 0px 0px',
		   	fontFamily :'Helvetica',
		   	textAlign: 'center',
			useSpan: true
		},
		"blank" : {

		   	backgroundColor : tungsten(0.0),	
		   	borderWidth : '0px',
		   	borderStyle : 'none',
		   	color : tungsten(1),
		   	padding : '0px 0px 0px 0px',
		   	fontFamily :'Helvetica',
		   	textAlign: 'left',
			useSpan: true
		},	
		"text" : {

		   	backgroundColor : tungsten(0.1),
			borderColor : tungsten(0.3),
			color : tungsten(1),
		   	borderWidth : '0px 0px 1px 0px',
		   	borderStyle : 'solid',
		   	padding : '2px',
		   	fontFamily :'Helvetica',
		   	textAlign: 'left',
		   	overflow:'auto',
			useSpan: true,
			minHeight: '100px'
		}
	};


	ObjectFactory.wrapView = function(child)
	{
		var wrappingView = new PositionableView();
		wrappingView.add(child.getModifier()).add(child);
		return wrappingView;
	};


	ObjectFactory.prototype.makeTextSurface = function (text)
	{
		var style = propertyMap.text;

		var surface = new TextareaSurface({
			size: [undefined, true],
			properties: style,
			value: text
		});

		surface.setAttributes({readonly: false});
		surface.setProperties({resize: "none"});

		surface.setText = function (value)
		{
			this.text = text;
			this.setValue(value);
		};
		surface.getText = function ()
		{
			return this.text;
		};

		surface.setText(text);

		return surface;
	};

	ObjectFactory.prototype.makeSurface = function makeSurface(text, type)
	{
		if (type == undefined)
			type = "base";

		var surfaceOptions = propertyMap[type];
		var surface;

		surface = new Surface({
			size : [undefined, undefined],
			properties : propertyMap[type],
            classes: ['double-sided']
		});

		if (surfaceOptions.useSpan)
		{
			surface.setText = function (value)
			{
				var contentString = "<span><p>" + value + "</p></span>";
				this.setContent(contentString);
			};
		}
		else
		{
			surface.setText = function(value){
				this.setContent(value);
			};
		}


		surface.setText(text);

		return surface;
	};

	ObjectFactory.prototype.makePositionable = function(object){

		object.position = [0,0,0];

		object.setPosition = function(newPosition){
			this.position = newPosition;
		};	

		// object.setSize = function(newSize){
		// 	this.size = newSize;
		// };	

		object.modifier = new Modifier({
			// size: function() {
			// 	return object._size;
			// },
			transform: function() {return Transform.translate(object.position[0],object.position[1],object.position[2]);
			}
		});

		if (object.calculatePosition == undefined)
		{
			object.calculatePosition = function() {
				return object.position;
			};
		}

		if (object.calculateSize == undefined)
		{
			object.calculateSize = function() {
				return object.size;
			};
		}
	};

	ObjectFactory.prototype.makeButtonView = function(text,styleName){

		var style = labelStyles.base;
		if (styleName != undefined)
			style = labelStyles[styleName];

		var buttonSurface = this.makeLabelSurface(text,styleName);
        buttonSurface.setProperties({textAlign:'center',cursor: 'pointer'});

		buttonSurface.modifier.alignFrom([0.5,0.5]);
		buttonSurface.modifier.originFrom([0.5,0.5]);

		buttonSurface.opacityState.set(style.modifiers.baseOpacity);
        buttonSurface.on('mouseenter',function(){
            buttonSurface.opacityState.set(style.modifiers.focusedOpacity,{duration:100, curve:Easing.outQuad});
		});

        buttonSurface.on('mouseleave',function(){
            buttonSurface.opacityState.set(style.modifiers.baseOpacity,{duration:100, curve:Easing.outQuad});
		});

		return buttonSurface;
	};


	ObjectFactory.prototype.makeLabelSurface = function(text,styleName){

		var style = labelStyles.base;

		if (styleName != undefined)
			style = labelStyles[styleName];

		var textSurface = new Surface({
		    size : [true, true],
		    properties : style.text
		});

		textSurface.setMaxSize = function (value){
			this.setProperties({maxWidth:value[0]+"px"});
		};

		textSurface.setText = function (value){
			this.text = value;
			this.setContent(this.text);
		};

		textSurface.modifier = new Modifier({
			opacity: function(){return textSurface.opacityState.get();}
		});

		textSurface.opacityState = new Transitionable(style.modifiers.baseOpacity);

		//textSurface.setMaxSize([200,true]);
		textSurface.setText(text);
		
		return textSurface;
	};

	ObjectFactory.prototype.makeLabelView = function(text,styleName){
		
		var view = new PositionableView();
		var style = labelStyles.base2;

		if (styleName != undefined)
			style = labelStyles[styleName];

		var textSurface = new Surface({
		    size : [true, true],
		    properties : style.text,
		    content:text,
            classes: ['double-sided']
		});

		view.setText = function(value){
			this.textSurface.setContent(value);
		};

		var backSurface = new Surface ({
			size : [undefined,undefined],
			properties: style.background,
            classes: ['double-sided']
		});

		var originNode = view.add(new Modifier({
			align:[0.5,0.5],
			origin:[0.5,0.5],
			opacity: function(){return view.opacityState.get();}
		}));

        originNode.add(textSurface);
        originNode.add(backSurface);

		//view.opacityState = new Transitionable(style.modifiers.baseOpacity);
		//view.modifier = new Modifier({size: function(){return view.size;}});
		view.textSurface = textSurface;
		view.backSurface = backSurface;

		return view;
	};


	ObjectFactory.prototype.makeCircularSurface = function(radius)
	{
		var circleProperties = propertyMap["base"];
		circleProperties.borderRadius = radius + "px";
		circleProperties.textAlign = "center";

		var surface = new Surface({
		    size : [radius*2, radius*2],
		    properties : circleProperties
		});

		circleProperties.borderRadius = "";

		surface.setValue = function(value){
			surface.setContent(value); //'<span style="vertical-align:middle">' + value + "</span>");
		};

		return surface;
	}

	ObjectFactory.prototype.makeCircularCanvasSurface = function(radius,scale)
	{
		var canvasSurface = new CanvasSurface({
		    size : [(radius*scale*2)+5, (radius*scale*2)+5]
		});


	 	var context = canvasSurface.getContext('2d');

	   	context.beginPath();
	    context.arc(radius*scale,radius*scale, (radius-5)*scale, 0, 2 * Math.PI, false);
	    context.fillStyle = tungsten(0.3);
	    context.fill();
	    context.lineWidth = 2.5*scale;
	    context.strokeStyle = tungsten(0.8);
	    context.stroke();

	    canvasSurface.setSize([radius*2,radius*2],[radius*2*scale,radius*2*scale]);

		return canvasSurface;
	}

	ObjectFactory.prototype.makeCircleView = function(radius)
	{
		var canvasSurface = this.makeCircularCanvasSurface(radius*2);

		var view = new View();

		view.getSize = function() {return [radius,radius*2];};
		view.add(canvasSurface);

		return view;
	};



	ObjectFactory.prototype.createAccessView = function createAccessView(style)
	{
		var view = new View();
		if (!style)
			style = 'base';

		var surface = this.makeSurface('',style);

		view.accessOpacity = 0.8;
		view.baseOpacity = 0.5;

		var state = new Transitionable(view.baseOpacity);
		surface.opacityMod  = new Modifier({
			opacity: function(){return  state.get();}
		});

		surface.originMod = new Modifier ({			
				origin: [0.5,0.5],
				align: [0.5,0.5]
		});

		view
			.add(surface.opacityMod)
			// .add(surface.originMod)
			.add(surface);

		view.surface = surface;
		view.opacityState = state;

		view.calculatePosition = function(){
			return this.owner.calculateChildPosition(this);
		};

		view.setValue = function(value) { this.surface.setValue(value);};
		view.access = function(callstack)
		{
			if (callstack != undefined)
				callstack.push(this.calculatePosition());

			if(state.isActive()) 
				state.halt();

			state.set(view.accessOpacity,{duration: 50, curve: Easing.outQuad},
				function() {
					state.set(view.baseOpacity,{ duration: 500, curve: Easing.outQuad });
				}
			);
		};

		return view;
	}


	ObjectFactory.prototype.createNumberView = function createNumberView(initialValue,numBits)
	{
		var numberView = (new ObjectFactory()).createAccessView('compact');

		numberView.numBits = numBits;
		numberView.setValue = function(number) {	
				numberView.access();		
			if (numberView.value != number)
			{
				numberView.value = number;
				var label='';

				if (this.numBits != undefined)
					label = "0x" + (number).toString(16);			
				else
					label = number;

				this.surface.setText(label);
			}
		};

		numberView.getValue = function() {

			this.access();
			return this.value;
		};

		numberView.setValue(initialValue);

		return numberView;
	};


	ObjectFactory.prototype.createFlagView = function createFlagView(initialValue,style)
	{
		var flagView = (new ObjectFactory()).createAccessView(style);
		flagView.offOpacity = flagView.baseOpacity;
		
		flagView.setValue = function(value)
		{
			if (value != flagView.value)
			{
				flagView.value = value;
				if(flagView.opacityState.isActive()) 
					flagView.opacityState.halt();

				var targetOpacity = (value) ? 1 : flagView.offOpacity;
				flagView.opacityState.set(targetOpacity,{duration: 100, curve: Easing.outQuad});
				flagView.baseOpacity = targetOpacity;
			}
		};

		flagView.surface.on('click',function(data){
			console.log('click!');
			flagView.setValue(!flagView.value);
		});

		flagView.setValue(initialValue);
		return flagView;
	};

	module.exports = ObjectFactory;
});





























