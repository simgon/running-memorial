require "test_helper"

class RouteTest < ActiveSupport::TestCase
  def setup
    @user = User.new
    @route = @user.routes.build()
  end

  test "should be valid" do
    assert @route.valid?
  end

  test "name should be at most 50 characters" do
    @route.name = "a" * 51
    assert_not @route.valid?

    @route.name = "a" * 50
    assert @route.valid?

    @route.name = "a" * 49
    assert @route.valid?

    @route.name = ""
    assert @route.valid?
  end
end
