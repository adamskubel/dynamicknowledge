define(function(require,exports,module){


    var View = require('famous/core/View');
    var Modifier = require("famous/core/Modifier");
    var Surface = require("famous/core/Surface");
    var Transform = require("famous/core/Transform");
    var MouseSync = require('famous/inputs/MouseSync');
    var StretchyLayout = require('PositioningLayouts/StretchyLayout');
    var PScrollView = require('PositioningLayouts/PositioningScrollView');
    var PositionableView = require('PositioningLayouts/PositionableView');
    var DynamicContainer = require('PositioningLayouts/DynamicContainer');
    var Colors = require('Colors');
    var BoxView = require('PositioningLayouts/BoxView');
    var Vector = require('./ProperVector');
    var ModelLoader = require('ModelLoader');
    var Engine = require("famous/core/Engine");
    var Transitionable = require('famous/transitions/Transitionable');
    var Easing = require('famous/transitions/Easing');
    var Utils = require('Utils');

    var cameraAngles = [0,0];

    function MainView(context, options)
    {
        View.call(this, options);

        this.context = context;
        _buildView.call(this);
    }

    MainView.prototype = Object.create(View.prototype);
    MainView.prototype.constructor = MainView;

    MainView.DEFAULT_OPTIONS = {

    };


    MainView.prototype.setModel = function(mainViewObject,modelLoader){

        this.state = 'base';
        this.modelLoader = modelLoader;

        var props = mainViewObject.getState(this.state).properties;

        var focusName = props.get('FocusObject');
        console.log("Loading focus object '" + focusName + "'");
        var focusObject = this.modelLoader.getObject(focusName);

        this.setActiveController(focusObject);

    };

    MainView.prototype.setEditMode = function(editMode)
    {
        if (this.activeController.setEditMode)
        {
            this.activeController.setEditMode(editMode);
        }
    };

    MainView.prototype.setActiveController = function(newController)
    {
        if (this.activeView)
        {
            this.activeView.hide();
        }

        this.activeView = newController.getView();

        this.mainLayout.add(this.activeView.getModifier()).add(this.activeView.getRenderController());
        this.activeController = newController;
        this.dynamicNodes.push(this.activeView);

        DynamicKnowledge.EditManager.setGlobalController(newController);
    };

    MainView.prototype.setCameraMode = function(cameraMode)
    {
        var transition = {duration: 500, curve: Easing.inOutQuad};

        if (this.cameraModifier.state.isActive())
            this.cameraModifier.state.halt();
        if (cameraMode == "2D")
        {
            //noinspection JSCheckFunctionSignatures
            this.cameraControlSurface.hide();
            this.cameraModifier.state.set(0, transition);
        }
        else if (cameraMode == "3D")
        {
            //noinspection JSCheckFunctionSignatures
            this.cameraControlSurface.hide();
            this.cameraModifier.state.set(1, transition);
        }
        else if (cameraMode == "Free")
        {
            this.cameraControlSurface.show();
        }
        this.cameraMode = cameraMode;
    };

    function _buildCamera(){

        var _this = this;

        var cameraModifier = new Modifier({
            transform: function () {
                if (_this.cameraMode == "Free")
                {
                    return Transform.rotate(cameraAngles[0]*(Math.PI/180),cameraAngles[1]*(Math.PI/180), 0);
                }
                else
                {
                    return Transform.rotate(Math.PI * (-1 / 6) * this.state.get(), Math.PI * (1 / 4) * this.state.get(), 0);
                }
            }
        });

        cameraModifier.state = new Transitionable(0);

        return cameraModifier;
    }

    function _buildView(){

        var mainView = this;

        this.cameraModifier = _buildCamera();

        var rootNode = mainView.add(new Modifier({
            align: [0.5,0.5]
        })).add(this.cameraModifier);

        var cameraSync = new MouseSync();

        var mouseCaptureSurface = new Surface();
        mouseCaptureSurface.pipe(cameraSync);
        cameraSync.on('update',function(data){
            cameraAngles[0] += data.delta[1]*-0.2;
            cameraAngles[1] += data.delta[0]*0.2;
        });

        Utils.attachRenderController(mouseCaptureSurface);
        this.context.add(new Modifier({transform:Transform.translate(0,0,-1000)})).add(mouseCaptureSurface.renderController);


        var mainLayout = new PositionableView({
            viewOrigin:[0.5,0.5],
            viewAlign:[0.3,0.5],
            isAnimated:false,
            name:"MainView"
        });

        mainLayout.calculatePosition = function(){
            var p = Vector.fromArray(mainLayout.position);
            var s = this.context.getSize();
            if (s)
            {
                p = p.sub(Vector.fromArray(s).multiply(new Vector(0.2, 0, 0)));
            }
            return p.toArray();
        }.bind(this);

        var textWidth = this.context.getSize()[0]*0.4;
        var textLayout = new PScrollView({
            direction: 1,
            viewOrigin: [0,0.5],
            viewAlign: [0.6,0.5],
            size:[textWidth,undefined]
        });
        textLayout.textWidth= textWidth;

        textLayout.setPosition([0,0,0]);

        textLayout.calculatePosition = function(){
            var p = Vector.fromArray(textLayout.position);
            var s = this.context.getSize();
            if (s)
            {
                p = p.sub(Vector.fromArray(s).multiply(new Vector(-0.1, 0.5, 0)));
            }
            return p.toArray();
        }.bind(this);


        rootNode.add(mainLayout.getModifier()).add(mainLayout);
        mainView.add(textLayout.getModifier()).add(textLayout);

        var dynamicNodes = [];
        //dynamicNodes.push(mainLayout);
        dynamicNodes.push(textLayout);
        this.dynamicNodes = dynamicNodes;

        Engine.on('prerender',function(){
            //Timer.setInterval(function(){
            for (var i=0;i<dynamicNodes.length;i++)
            {
                var dn = dynamicNodes[i];
                if (dn.needsLayout())
                {
                    var sizes = dn.measure();
                    dn.layout(sizes.minimumSize);
                }
            }
        });

        this.cameraControlSurface = mouseCaptureSurface;
        this.textLayout = textLayout;
        this.mainLayout = mainLayout;
        this.rootNode = rootNode;

    }


    //SideBarController.prototype.addText = function(string, name)
    //{
    //    var pointAt = (name) ? this.modelLoader.getObject(name) : null;
    //
    //    var linkValid = (pointAt != undefined);
    //
    //    var textView = new BoxView({
    //        size:[this.textLayout.textWidth,true],
    //        color:Colors.Annotation,
    //        text:string,
    //        textAlign:[0,0],
    //        style:(linkValid) ? 'borderOnly' : 'noBorder',
    //        fontSize:'normal',
    //        scrollviewSizeHack: true,
    //        clickable:linkValid,
    //        useMarkdown:true
    //    });
    //
    //    if (linkValid)
    //    {
    //        //var pointLine = new LineCanvas();
    //        //pointLine.setLineObjects(textView, pointAt);
    //        //rootNode.add(pointLine.getModifier()).add(pointLine);
    //        //textLayout.on('positionUpdate',function(){
    //        //    pointLine.update();
    //        //});
    //
    //        textView.on('click', function ()
    //        {
    //            pointAt.setState(string);
    //
    //        }.bind(this));
    //    }
    //
    //    //textView.//textSurface.setContent(markdown.toHTML(string));
    //
    //    this.textLayout.addChild(textView);
    //    return textView;
    //};

    module.exports = MainView;

});