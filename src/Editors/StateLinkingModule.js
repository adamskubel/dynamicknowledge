define(function(require,exports,module)
{
    var Utils = require('Utils');
    var ListSelector = require('Views/ListSelector');
    var MenuBar = require('Views/MenuBar');
    var Colors = require('Colors');

    function StateLinkingModule(parentController)
    {
        this.controller = parentController;
        this._objectsToHide = [];
        this._activeTriggerCleanupFunctions = [];
    }


    StateLinkingModule.prototype.createUI = function(menu)
    {
        this.hide();

        var addButton = MenuBar.makeMenuButton("S");
        addButton.on('click',_editStates.bind(this));

        this._hideObjectFunction = function()
        {
            menu.removeChild(addButton);
        };

        menu.addChild(addButton);

        this._hideObjectFunction = function()
        {
            menu.removeChild(addButton);
        }
    };

    StateLinkingModule.prototype.hide = function()
    {
        console.debug("Hiding state link");
        _deactivateTrigger.call(this);

        if (this._hideObjectFunction)
            this._hideObjectFunction();

        for (var i=0;i<this._objectsToHide;i++)
        {
            var object =  this._objectsToHide[i];
            object.hide();
        }

        this._objectsToHide = [];
    };


    function _deactivateTrigger()
    {
        if (!this._activeTrigger)
            return;

        this._activeTrigger.button.setHighlighted(false);

        for (var i=0;i<this._activeTriggerCleanupFunctions.length;i++)
        {
            this._activeTriggerCleanupFunctions[i]();
        }

        this._activeTrigger = undefined;
    }

    function _activateTrigger(trigger, listenEnablers)
    {
        _deactivateTrigger.call(this);

        this._activeTrigger = trigger;

        trigger.button.setHighlighted(true);

        function prepareEnabler(enabler)
        {
            enabler.button.show();

            var onEnable = function(){
                enabler.button.setHighlighted(true);
                trigger.addListener(enabler.controller, enabler.controller.state);
            };

            enabler.button.on('click',onEnable);

            this._activeTriggerCleanupFunctions.push(function(){
                enabler.button.removeListener('click',onEnable);
                enabler.button.hide();
            });
        }

        for (var i=0;i<listenEnablers.length;i++)
        {
            prepareEnabler.call(this, listenEnablers[i]);
        }
    }

    function _editStates()
    {
        var stateTriggers = [];
        var triggerListenEnablers = [];

        this.controller.visitAll(function(controller){

            if (!controller.enableMode)
                return;

            var stateModeContext = {
                stateTriggers:stateTriggers,
                listenEnablers:triggerListenEnablers
            };

            controller.enableMode("stateLinking",stateModeContext);
        });


        function prepareTrigger(stateTrigger)
        {
            stateTrigger.button.on('click', function ()
            {
                if (this._activeTrigger != stateTrigger)
                {
                    _activateTrigger.call(this,stateTrigger, triggerListenEnablers);
                }
                else
                   _deactivateTrigger.call(this);

            }.bind(this));
        }

        for (var i=0;i<stateTriggers.length;i++)
        {
            this._objectsToHide.push(stateTriggers[i].button);
            prepareTrigger.call(this,stateTriggers[i]);
        }
    }

    module.exports = StateLinkingModule;

});