require "test_helper"

class RouteTest < ActiveSupport::TestCase
  def setup
    @user = User.new
    @route = @user.routes.build()
  end

  test "should be valid" do
    assert @route.valid?
  end
end
