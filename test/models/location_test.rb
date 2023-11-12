require 'test_helper'

class LocationTest < ActiveSupport::TestCase
  def setup
    @user = User.new
    @route = @user.routes.build
    @location = @route.locations.build
  end

  test 'should be valid' do
    assert @location.valid?
  end
end
