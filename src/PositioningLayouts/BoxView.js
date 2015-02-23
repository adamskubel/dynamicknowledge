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
    var TextareaSurface    = require("famous/surfaces/TextareaSurface");
    var RenderController = require("famous/views/RenderController");
    var Utils = require('../Utils');


    var Colors = require('../Colors');

    var opacityMap = {
        "base":{
            font: 1,
            background:0.25,
            border:1
        },
        "textOnly":{
            font:1,
            background:0,
            border:0
        },
        "noBorder":{
            font:1,
            background:0.25,
            border:0
        },
        "borderOnly":{
            font:1,
            background:0,
            border:1
        }
    };

    function makeStyle(colorName,styleName,fontSize)
    {
        var opacity = opacityMap.base;
        if (styleName)
            opacity = opacityMap[styleName];

        return {
            "text" :
            {
                backgroundColor : Colors.Transparent(),
                borderStyle : 'none',
                color : Colors.get(colorName,opacity.font),
                fontFamily :'Helvetica',
                textAlign: 'left',
                fontSize: fontSize,
                padding: '6px'
            },
            "background" :
            {
                backgroundColor : Colors.get(colorName,opacity.background),
                borderColor : Colors.get(colorName,opacity.border),
                borderWidth : '1px',
                borderStyle : 'solid'
            },
            "modifier":
            {
                baseOpacity: 0.4,
                highlightOpacity: 0.7,
                pulseOpacity: 0.9
            }

        };
    }

    var opacityTransition = {
        pulseRise: {duration: 50,curve:Easing.inQuad},
        pulseFall: {duration: 500,curve:Easing.outQuad}
    };

    var textAlignTransition = {duration:250,curve:Easing.inOutQuad};


	function BoxView(options)
	{
        SurfaceWrappingView.call(this, null,options);


        this.activeStyle = makeStyle(this.options.color,this.options.style,this.options.fontSize);

        this.textAlignState = new Transitionable(this.options.textAlign);
        var textAlignState = this.textAlignState;
        this.textNode = this.add(new Modifier({
            transform:Transform.translate(0,0,1),
            align:function(){return textAlignState.get();},
            origin:function(){return textAlignState.get()}
        }));

        if (this.options.editable)
        {
            this.editTextSurface = _makeEditTextSurface.call(this);
            this.textNode.add(this.editTextSurface.renderController);
            this.wrapSurface = this.editTextSurface;
            this.editTextSurface.show();
        }
        else
        {
            this.textSurface = _makeTextSurface.call(this);
            this.textNode.add(new Modifier({transform:Transform.translate(0,0,0)})).add(this.textSurface.renderController);
            this.wrapSurface = this.textSurface;
            this.textSurface.show();
        }

        //Make background surface
        this.backSurface = new Surface({
            size:[undefined,undefined],
            properties:this.activeStyle.background
        });

        this.bgOpacityState = new Transitionable(this.activeStyle.modifier.baseOpacity);
        var bgMod = new Modifier({
            opacity:function(){return this.bgOpacityState.get();}.bind(this),
            transform: Transform.translate(0,0,0)
        });
        this.add(bgMod).add(this.backSurface);

        //Configuration
        this.setClickable(this.options.clickable);
        this.setText(this.options.text);
        this.setSize(this.options.size);
	}

    BoxView.prototype = Object.create(SurfaceWrappingView.prototype);
    BoxView.prototype.constructor = BoxView;

    BoxView.DEFAULT_OPTIONS = {
        clickable: false,
        scrollviewSizeHack: false,
        color:3500,
        text:"",
        textAlign:[0.5,0.5],
        fontSize:'small',
        editable:false,
        rendercontrol:false,
        renderWhitespace:false,
        size:[20,20],
        useMarkdown:false
    };


    function _makeTextSurface()
    {
        var textSurface = new Surface({
            size: [true, true],
            properties: this.activeStyle.text
        });


        if (this.options.renderWhitespace)
            textSurface.setClasses(['show-whitespace']);

        Utils.attachRenderController(textSurface);

        if (this.size && this.size[0] != undefined && this.size[0] != true)
        {
            if (this.options.scrollviewSizeHack)
                textSurface.setSize([this.size[0],true]);

            textSurface.setProperties({maxWidth: this.size[0] + 'px'});
        }

        return textSurface;
    }

    function _makeEditTextSurface(){

        var editTextSurface = new TextareaSurface({
            size:[undefined,undefined],
            properties:this.activeStyle.text
        });

        editTextSurface.setProperties({resize: "none"});

        Utils.attachRenderController(editTextSurface);

        editTextSurface.on('keyup',function(data){
            this._text = editTextSurface.getValue();
        }.bind(this));

        return editTextSurface;
    }
    BoxView.prototype.setPadding = function(padding)
    {
        this.textSurface.setProperties({
            padding: padding + 'px'
        });
    };

    BoxView.prototype.setColor = function(color){

    };

    BoxView.prototype.setSize = function(size){
        SurfaceWrappingView.prototype.setSize.call(this,size);

        if (this.textSurface)
        {
            if (size && size[0] != undefined && size[0] != true)
            {
                if (this.options.scrollviewSizeHack)
                    this.textSurface.setSize([size[0], true]);

                this.textSurface.setProperties({maxWidth: size[0] + 'px'});
            }
        }
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

                var mouseHighlight = function(mouseover){

                    if (this.bgOpacityState.isActive())
                        this.bgOpacityState.halt();

                    var baseOpacity = (this._highlighted) ? this.activeStyle.modifier.highlightOpacity : this.activeStyle.modifier.baseOpacity;
                    var onOpacity = (mouseover) ? this.activeStyle.modifier.pulseOpacity : baseOpacity;

                    this.bgOpacityState.set(onOpacity,(mouseover) ? opacityTransition.pulseRise : opacityTransition.pulseFall);
                }.bind(this);

                this.textSurface.on('mouseenter',function(){
                    mouseHighlight(true);
                }.bind(this));

                this.textSurface.on('mouseleave',function(){
                    mouseHighlight(false);
                }.bind(this));

                this.backSurface.on('mouseenter',function(){
                    mouseHighlight(true);
                }.bind(this));

                this.backSurface.on('mouseleave',function(){
                    mouseHighlight(false);
                }.bind(this));
            }
        }
    };

    BoxView.prototype.setEditable = function(editable){

        if (editable)
        {
            if (this.textSurface)
                this.textSurface.hide();

            if (!this.editTextSurface)
            {
                this.editTextSurface = _makeEditTextSurface.call(this);
                this.textNode.add(this.editTextSurface.renderController);
            }
            this.editTextSurface.show();
        }
        else
        {
            if (!this.textSurface)
            {
                this.textSurface = _makeTextSurface.call(this);
                this.textNode.add(this.textSurface.renderController);
            }
            this.textSurface.show();

            if (this.editTextSurface)
                this.editTextSurface.hide();
        }

        this.setText(this._text);

    };

    BoxView.prototype.getText = function()
    {
        return this._text;
    };

    BoxView.prototype.setText = function(text){
        this._text = text;

        if (this.editTextSurface)
            this.editTextSurface.setValue(text);

        if (this.textSurface)
        {
            if (this.options.useMarkdown)
                this.textSurface.setContent(markdown.toHTML(text));
            else
                this.textSurface.setContent(text);
        }
    };

    BoxView.prototype.pulse = function(){

       this.pulse(opacityTransition.pulseRise,opacityTransition.pulseFall);
    };

    BoxView.prototype.pulse = function(riseTime,fallTime){

        if (this.bgOpacityState.isActive())
            this.bgOpacityState.halt();

        this.bgOpacityState.set(this.activeStyle.modifier.highlightOpacity,{duration:riseTime,curve:Easing.inQuad}, function(){
            this.bgOpacityState.set(this.activeStyle.modifier.baseOpacity,{duration:fallTime,curve:Easing.inQuad});
        }.bind(this));
    };

    BoxView.prototype.setHighlighted = function(highlighted){

        this._highlighted = highlighted;

        if (this.bgOpacityState.isActive())
            this.bgOpacityState.halt();

        var o = (highlighted) ? this.activeStyle.modifier.highlightOpacity : this.activeStyle.modifier.baseOpacity;
        this.bgOpacityState.set(o,(highlighted) ? opacityTransition.pulseRise : opacityTransition.pulseFall);
    };

    BoxView.prototype.setTextAlignment = function(textAlign){
        if (this.textAlignState.isActive())
            this.textAlignState.halt();

        this.textAlignState.set(textAlign,textAlignTransition);
    };

    module.exports = BoxView;
});	