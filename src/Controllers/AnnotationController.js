define(function (require, exports, module)
{
    var DynamicContainer = require('PositioningLayouts/DynamicContainer');
    var BoxView = require('PositioningLayouts/BoxView');
    var Utils = require('Utils');

    var MouseSync = require('famous/inputs/MouseSync');
    var Vector = require('ProperVector');
    var LineCanvas = require('./../LineCanvas');

    var Label = require('Model/Label');

    var EventEmitter = require("famous/core/EventEmitter");


    var annoColor = 6000;
    var editColor = 12000;

    function AnnotationController(annotationsDef,modelLoader){

        this._model = annotationsDef;

        this._eventOutput = new EventEmitter();

        this.modelLoader = modelLoader;
        this.gapiModel = modelLoader.getModel();

        this.annotationMap = {};

        _makeContainer.call(this);
        _initEditUI.call(this,this.annotationContainer);

        this.setState('base');
        this.setEditMode("Off");
    }


    AnnotationController.prototype.setEditMode = function(mode)
    {
        if (this._editMode != mode)
        {
            this._editMode = mode;

            for (var labelKey in this.annotationMap)
            {
                var labelController = this.annotationMap[labelKey];
                labelController.setEditMode(this._editMode);
            }

            if (mode == "IsEditing")
            {
                this._activeStateLabel.show();
                this.saveButton.hide();
                this.lineButton.hide();
                this.addLabelButton.show();
            }
            else
            {
                _saveAnnotations.call(this);
                this._activeStateLabel.show();
                this.saveButton.hide();
                this.addLabelButton.hide();
                this.lineButton.hide();
            }
        }
    };

    AnnotationController.prototype.setState = function(state){
        if (this.state != state)
        {
            this._activeStateLabel.setText(state);
            this.state = state;

            var stateDef = this._model.stateMap.get(state);

            if (stateDef)
            {
                var labelList = stateDef.children;

                attachList.call(this, labelList);
                loadLabelList.call(this,labelList);
            }
            else
            {
                if (this._editMode == "IsEditing")
                {
                    console.log("Creating new state '" + state + "'");
                    stateDef = this._model.createState(state);

                    for (var labelKey in this.annotationMap)
                    {
                        stateDef.children.push(labelKey);
                        this.annotationMap[labelKey].createState(state);
                    }

                    var labelList = stateDef.children;
                    attachList.call(this, labelList);
                    loadLabelList.call(this,labelList);
                }
                else
                {
                    console.log("State is not defined, removing all labels");
                    for (var labelKey in this.annotationMap)
                    {
                        this.annotationContainer.removeChild(this.annotationMap[labelKey].labelView);
                        delete this.annotationMap[labelKey];
                    }
                }
            }
        }
    };


    function loadLabelList(labelList)
    {
        console.log("Loading " + labelList.length + " labels");

        //Remove labels present in container, but not in list
        for (var labelKey in this.annotationMap)
        {
            var found = (labelList.indexOf(labelKey) >= 0);

            if (!found)
            {
                this.annotationContainer.removeChild(this.annotationMap[labelKey].labelView);
                delete this.annotationMap[labelKey];
            }
        }

        //Add new labels
        for (var i = 0; i < labelList.length; i++)
        {
            var label = labelList.get(i);
            _addLabel.call(this,label);
        }

    }

    function _addLabel(labelName)
    {

        if (this.annotationMap[labelName])
        {
            this.annotationMap[labelName].setState(this.state);
        }
        else
        {
            console.log("Adding label with name: " + labelName);

            var labelController = this.modelLoader.getObject(labelName);
            labelController.setState(this.state);
            labelController.setEditMode(this._editMode);

            labelController.onDelete(function(){
                this.labelList.removeValue(labelName);
            }.bind(this));

            var labelView = labelController.getView();
            if (labelView)
            {
                this.annotationContainer.addChild(labelView);
                this.annotationMap[labelName] = labelController;
            }
        }
    }

    function _listOnAdded(event){
        for (var i = 0; i < event.values.length; i++)
        {
            var label = event.values[i];
            _addLabel.call(this,label);
        }
    }

    function _listOnRemoved(event){
        for (var i=0;i<event.values.length;i++)
        {
            this.annotationContainer.removeChild(this.annotationMap[event.values[i]].labelView);
            delete this.annotationMap[event.values[i]];
        }
    }

    function _listOnSet(event){

        console.log("Set values: " + event.values);
    }

    function attachList(labelList)
    {
        if (this._unloadListCallback)
            this._unloadListCallback();

        this._unloadListCallback = null;

        this.labelList = labelList;

        var onAdded = _listOnAdded.bind(this);
        var onRemoved = _listOnRemoved.bind(this);
        var onSet = _listOnSet.bind(this);

        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED,onAdded);
        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, onRemoved);
        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, onSet);

        this._unloadListCallback = function(){
            labelList.removeEventListener(gapi.drive.realtime.EventType.VALUES_ADDED,onAdded);
            labelList.removeEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, onRemoved);
            labelList.removeEventListener(gapi.drive.realtime.EventType.VALUES_SET, onSet);
        };
    }

    AnnotationController.prototype.close = function()
    {
        _saveAnnotations.call(this);
        this.setEditMode("CanEdit");
    };

    function _initEditUI(dc)
    {
        if (!this.addLabelButton)
        {
            var addLabelButton = new BoxView({
                text: "+", size: [40, 40], clickable: true, color: annoColor,
                position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
            });

            dc.add(addLabelButton.getModifier()).add(addLabelButton.getRenderController());

            addLabelButton.on('click', function ()
            {
                var model = Label.create(this.gapiModel,this.modelLoader.nextObjectId());

                model.size = [160, 80];
                model.text = "Label!";
                var newState = model.createState(this.state);
                newState.position = [0,-10,0];

                this.modelLoader.addObject(model.id,model);

                this.labelList.push(model.id);
            }.bind(this));

            var saveButton = new BoxView({
                text: "[]", size: [40, 40], clickable: true, color: annoColor,
                position: [40, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
            });

            saveButton.getRenderController();
            //dc.add(saveButton.getModifier()).add(saveButton.getRenderController());

            saveButton.on('click', function ()
            {
                this.close();
            }.bind(this));

            var lineButton = new BoxView({
                text: "|", size: [40, 40], clickable: true, color: annoColor,
                position: [80, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
            });


            dc.add(lineButton.getModifier()).add(lineButton.getRenderController());

            lineButton.on('click', function ()
            {
                _startLineDraw.call(this, dc);
            });

            var activeStateLabel = new BoxView({
                text: "...",
                size: [100, 30],
                color: annoColor,
                position: [0, 0, 15],
                viewOrigin: [1,1],
                viewAlign: [1,0],
                clickable:true
            });

            activeStateLabel.on('click',function(){
                this.setState('base');
            }.bind(this));

            dc.add(activeStateLabel.getModifier()).add(activeStateLabel.getRenderController());

            this._activeStateLabel = activeStateLabel;
            this.saveButton = saveButton;
            this.addLabelButton = addLabelButton;
            this.lineButton = lineButton;
        }
    }


    function _makeContainer()
    {
        var dc = new DynamicContainer({
            edgePadding: [10, 10]
        });

        var containerBackground = new BoxView({
            color: annoColor,
            style: 'borderOnly',
            size: [undefined,undefined]
        });

        dc.add(containerBackground.getModifier()).add(containerBackground);
        dc.background = containerBackground;

        this.annotationContainer = dc;
    }

    function _saveAnnotations()
    {
        for (var key in this.annotationMap)
        {
            var labelController = this.annotationMap[key];
            labelController.persist();
        }
    }



    function _startLineDraw(dc)
    {
        for (var i = 0; i < dc._children.length; i++)
        {
            if (dc._children[i] instanceof BoxView)
                _makeLineAnchors.call(this, dc._children[i], dc);
        }
    }

    function _addReceivingAnchors(anchor, receiver, dc)
    {

        var alignList = [
            [0.5, 0],
            [1, 0.5],
            [0.5, 1],
            [0, 0.5]
        ];

        //for (var i=0;i<alignList.length;i++){

        var lineAnchor = new BoxView({
            size: [20, 20],
            clickable: true,
            color: 1700,
            viewAlign: alignList[0],
            viewOrigin: [0.5, 0.5],
            position: [0, 0, 5]
        });

        Utils.attachRenderController(lineAnchor);

        receiver.add(lineAnchor.getModifier()).add(lineAnchor.renderController);
        lineAnchor.show(); 


        lineAnchor.parent = receiver;

        lineAnchor.textSurface.on('mousemove', function ()
        {
            //console.log('hi!');
            anchor.activeReceiver = lineAnchor;
        });

        lineAnchor.backSurface.on('mouseleave', function ()
        {
            anchor.activeReceiver = undefined;
        });

        anchor.on('draw_end', function (activeReceiver)
        {

            if (lineAnchor != activeReceiver)
                lineAnchor.hide();
        });

    }

    function _addReceivingAnchorsAll(anchor, dc)
    {

        for (var i = 0; i < dc._children.length; i++)
        {
            var child = dc._children[i];
            if (child != anchor.parent)
                _addReceivingAnchors.call(this, anchor, child, dc);
        }
    }

    function _addLineDrawingToAnchor(anchor, dc)
    {

        var lineSync = new MouseSync({
            propogate: true
        });

        anchor.activeLine = new LineCanvas();
        anchor.activeLine.parent = dc;

        lineSync.on('start', function (data)
        {
            _addReceivingAnchorsAll.call(this, anchor, dc);
            anchor.activeLineEnd = Vector.fromArray(anchor.calculatePosition(dc));
        }.bind(this));

        lineSync.on('update', function (data)
        {
            anchor.activeLineEnd = Vector.fromArray(data.delta).add(anchor.activeLineEnd);
            anchor.activeLine.setLinePoints(anchor.calculatePosition(dc), anchor.activeLineEnd.toArray());
        });

        lineSync.on('end', function (data)
        {
            if (anchor.activeReceiver)
            {
                console.log("Binding to " + anchor.activeReceiver._globalId);
                anchor.parent.on('positionChange', function ()
                {
                    anchor._eventOutput.emit('positionChange');
                });
                anchor.activeLine.setLineObjects(anchor, anchor.activeReceiver);
            }
            anchor._eventOutput.emit('draw_end', anchor.activeReceiver);
        });

        dc.add(anchor.activeLine.getModifier()).add(anchor.activeLine);

        anchor.backSurface.pipe(lineSync);
        anchor.textSurface.pipe(lineSync);
        anchor._drawMouseSync = lineSync;
    }

    function _makeLineAnchors(box, dc)
    {
        var alignList = [
            [0.5, 0],
            [1, 0.5],
            [0.5, 1],
            [0, 0.5]
        ];

        for (var i = 0; i < alignList.length; i++)
        {

            var lineAnchor = new BoxView({
                size: [20, 20],
                clickable: true,
                color: 18000,
                viewAlign: alignList[i],
                viewOrigin: [0.5, 0.5],
                position: [0, 0, 5]
            });

            box.add(lineAnchor.getModifier()).add(lineAnchor);
            _addLineDrawingToAnchor.call(this, lineAnchor, dc);

            lineAnchor.parent = box;
        }
    }


    module.exports = AnnotationController;

});