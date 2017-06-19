import ipywidgets as widgets
from traitlets import Unicode, Dict, Bool, Tuple
import sys
from typing import Callable, Optional
from IPython.utils.capture import capture_output, RichOutput
from IPython.display import display, clear_output
from .output import StatefulOutput 


@widgets.register('justitia.TestCase')
class TestCase(StatefulOutput):
    """"""
    _view_name = Unicode('TestCaseView').tag(sync=True)
    _model_name = Unicode('TestCaseModel').tag(sync=True)
    _view_module = Unicode('justitia').tag(sync=True)
    _model_module = Unicode('justitia').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)
    title = Unicode('Test case').tag(sync=True)
    state = Unicode('ready').tag(sync=True)
    _result = Dict({"data": {}, "metadata": {}}).tag(sync=True)
    frozen = Bool(False).tag(sync=True)

    def __init__(self, fn: Optional[Callable[[], None]] = None, **kwargs):
        super().__init__(**kwargs)
        self._testcase = None
        self(fn)

        self.on_msg(self._handle_run)

    def __call__(self, fn: Callable[[], None]) -> 'TestCase':
        self._testcase = fn
        self.frozen = fn is None
        return self

    @property
    def result(self):
        return RichOutput(data=self._result['data'], metadata=self._result['metadata'])

    @result.setter
    def result(self, val):
        with capture_output(stdout=False, stderr=False, display=True) as c:
            display(val)
        self._result = dict(data=c.outputs[0].data, metadata=c.outputs[0].metadata)

    def run(self):
        if isinstance(self._testcase, Callable) and self.state != 'excluded':
            result = None
            self.state = 'running'
            with self:
                try:
                    clear_output()
                    result = self._testcase()
                    if result is None:
                        self.state = 'pass'
                    else:
                        self.state = 'warn'
                    self.result = result
                except Exception as e:
                    self.result = e
                    self.state = 'fail'
                    raise

                return result


    def _handle_run(self, _, content, __):
        if content['event'] == 'run':
            self.run()

