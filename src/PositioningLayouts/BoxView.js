define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var SurfaceWrappingView = require('./SurfaceWrappingView');

    var Colors = require('../Colors');

    function makeStyle(colorName)
    {
        return {
            "text" :
            {
                backgroundColor : Colors.Transparent(),
                borderStyle : 'none',
                color : Colors.get(colorName,1),
                fontFamily :'Helvetica',
                textAlign: 'left',
                fontSize: 'small',
                padding: '6px'
            },
            "background" :
            {
                backgroundColor : Colors.get(colorName,0.25),
                borderColor : Colors.get(colorName,1),
                borderWidth : '1px',
                borderStyle : 'solid'
            },
            "modifier":
            {
                baseOpacity: 0.4,
                highlightOpacity: 0.8
            }

        };
    }

    var opacityTransition = {
        pulseRise: {duration: 500,curve:Easing.inQuad},
        pulseFall: {duration: 500,curve:Easing.outQuad}
    };

    var textAlignTransition = {duration:250,curve:Easing.inOutQuad};


	function BoxView(options)
	{
        SurfaceWrappingView.call(this, null,options);


        this.activeStyle = makeStyle(this.options.tintColor);

        this.textSurface = new Surface({
            size: [true,true],
            properties: this.activeStyle.text,
            content:this.options.text
        });

        //Make text surface
        if (this.options.size && this.options.size[0] != undefined && this.options.size[0] != true)
        {
            this.textSurface.setProperties({maxWidth: this.options.size[0] + 'px'});
        }

        this.textAlignState = new Transitionable(this.options.textAlign);
        var textAlignState = this.textAlignState;
        this.add(new Modifier({align:function(){return textAlignState.get();},origin:function(){return textAlignState.get()}}))
            .add(this.textSurface);


        //Make background surface
        this.backSurface = new Surface({
            size:[undefined,undefined],
            properties:this.activeStyle.background
        });

        this.bgOpacityState = new Transitionable(this.activeStyle.modifier.baseOpacity);
        var bgMod = new Modifier({opacity:function(){return this.bgOpacityState.get();}.bind(this)});
        this.add(bgMod).add(this.backSurface);


        //Configuration
        this.setClickable(this.options.clickable);
        this.setText(this.options.text);
        this.wrapSurface = this.textSurface;
	}

	BoxView.prototype = Object.create(SurfaceWrappingView.prototype);
	BoxView.prototype.constructor = BoxView;

    BoxView.DEFAULT_OPTIONS = {
        clickable: false,
        tintColor:3500,
        text:"",
        textAlign:[0.5,0.5]
    };

    BoxView.prototype.setPadding = function(padding)
    {
        this.textSurface.setProperties({
            padding: padding + 'px'
        });
    };

    BoxView.prototype.setTintColor = function(tintColor){

    };

    BoxView.prototype.setClickable = function(clickable){
        if (this._clickable != clickable)
        {
            this._clickable = clickable;
            if (clickable){

                this.backSurface.setProperties({cursor:'pointer'});
                this.textSurface.setProperties({cursor:'pointer'});

                this._onClick = function(data){this._eventOutput.emit('click',data)}.bind(this);

                this.textSurface.on('click',this._onClick );
                this.backSurface.on('click',this._onClick );
            }
        }
    };

    BoxView.prototype.setText = function(text){
        this._text = text;
        this.textSurface.setContent(text);
    };

    BoxView.prototype.pulse = function(){

        if (this.bgOpacityState.isActive())
            this.bgOpacityState.halt();

        this.bgOpacityState.set(this.activeStyle.modifier.highlightOpacity,opacityTransition.pulseRise, function(){
            this.bgOpacityState.set(this.activeStyle.modifier.baseOpacity,opacityTransition.pulseFall);
        }.bind(this));
    };

    BoxView.prototype.pulse = function(riseTime,fallTime){

        if (this.bgOpacityState.isActive())
            this.bgOpacityState.halt();

        this.bgOpacityState.set(this.activeStyle.modifier.highlightOpacity,{duration:riseTime,curve:Easing.inQuad}, function(){
            this.bgOpacityState.set(this.activeStyle.modifier.baseOpacity,{duration:fallTime,curve:Easing.inQuad});
        }.bind(this));
    };

    BoxView.prototype.setHighlighted = function(highlighted){

        if (this.bgOpacityState.isActive())
            this.bgOpacityState.halt();

        var o = (highlighted) ? this.activeStyle.modifier.highlightOpacity : this.activeStyle.modifier.baseOpacity;
        this.bgOpacityState.set(o,opacityTransition.pulseRise);
    };

    BoxView.prototype.setTextAlignment = function(textAlign){
        if (this.textAlignState.isActive())
            this.textAlignState.halt();

        this.textAlignState.set(textAlign,textAlignTransition);
    };

    module.exports = BoxView;
});	