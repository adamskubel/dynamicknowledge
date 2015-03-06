define(function(require,exports,module){

    var AbstractObjectController = require('./AbstractObjectController');

    function DynamicContainerController()
    {

    }

    DynamicContainerController.prototype = Object.create(AbstractObjectController.prototype);
    DynamicContainerController.prototype.constructor = DynamicContainerController;

    DynamicContainerController.prototype.getOutputs = function()
    {
        var outputs = [];
        for (var i=0;i<this.controllers.length;i++)
        {
            if (this.controllers[i].getOutputs)
            {
                var c = this.controllers[i].getOutputs();
                if (c instanceof Array)
                {
                    for (var j=0;j< c.length;j++)
                        outputs.push(c[j]);
                }
                else if (c)
                    outputs.push(c);
            }
        }

        return outputs;
    };

    DynamicContainerController.prototype.getInputs = function(name)
    {
        var inputs = [];
        for (var i=0;i<this.controllers.length;i++)
        {
            if (this.controllers[i].getInputs)
            {
                var c = this.controllers[i].getInputs(name);
                if (c instanceof Array)
                {
                    for (var j=0;j< c.length;j++)
                        inputs.push(c[j]);
                }
                else if (c)
                    inputs.push(c);
            }
        }

        return inputs;
    };


    function _makeContainerView()
    {
        var dc = new DynamicConstraintLayout();

        var containerBackground = new BoxView({
            color: 2000,
            style: 'borderOnly',
            size: [undefined,undefined]
        });

        dc.add(containerBackground.getModifier()).add(containerBackground.getRenderController());

        return dc;
    }




    module.exports = DynamicContainerController;

});